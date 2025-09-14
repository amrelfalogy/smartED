import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject as RxSubject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

import { Subject as CourseSubject } from 'src/app/core/models/course-complete.model';
import { AcademicYear, StudentYear } from 'src/app/core/models/academic-year.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { AcademicYearService } from 'src/app/core/services/academic-year.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-course-catalog',
  templateUrl: './course-catalog.component.html',
  styleUrls: ['./course-catalog.component.css']
})
export class CourseCatalogComponent implements OnInit, OnDestroy {
  // Data
  subjects: CourseSubject[] = [];
  filteredSubjects: CourseSubject[] = [];
  academicYears: AcademicYear[] = [];

  // Student years cache and index
  studentYearsCache = new Map<string, StudentYear[]>(); // key: academicYearId
  private studentYearIndex = new Map<string, StudentYear>(); // key: studentYearId
  private pendingAyFetch = new Set<string>(); // prevent duplicate requests

  // State
  isLoading = false;
  errorMessage = '';

  // Filters
  selectedAcademicYearId: string | null = null;
  selectedStudentYearId: string | null = null;
  searchTerm = '';
  selectedDifficulty: string | null = null;

  // View options
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'createdAt' | 'popularity' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Pagination (like admin list)
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;

  private destroy$ = new RxSubject<void>();

  constructor(
    private router: Router,
    private subjectService: SubjectService,
    private academicYearService: AcademicYearService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading
  private loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      subjects: this.subjectService.getAllSubjects().pipe(
        catchError(err => {
          console.error('Error loading subjects:', err);
          return of([]);
        })
      ),
      academicYears: this.academicYearService.getAcademicYears().pipe(
        catchError(err => {
          console.error('Error loading academic years:', err);
          return of([]);
        })
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ subjects, academicYears }) => {
          // Only show published subjects in public catalog
          this.subjects = (subjects || []).filter(s => s.status === 'published');
          this.academicYears = academicYears || [];
          this.applyFilters(); // will also ensure student years for shown AYs
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading initial data:', error);
          this.errorMessage = 'حدث خطأ أثناء تحميل الدورات. يرجى المحاولة مرة أخرى.';
          this.isLoading = false;
        }
      });
  }

  // Exposed for template retry button
  reload(): void {
    this.loadInitialData();
  }

  // Filters
  get studentYearsForSelectedAY(): StudentYear[] {
    if (!this.selectedAcademicYearId) return [];
    return this.studentYearsCache.get(this.selectedAcademicYearId) || [];
  }

  selectAcademicYear(ayId: string): void {
    if (this.selectedAcademicYearId === ayId) {
      // Toggle off
      this.selectedAcademicYearId = null;
      this.selectedStudentYearId = null;
      this.applyFilters();
      return;
    }

    this.selectedAcademicYearId = ayId;
    this.selectedStudentYearId = null;

    // Fetch student years for the selected AY if not cached
    if (!this.studentYearsCache.has(ayId) && !this.pendingAyFetch.has(ayId)) {
      this.pendingAyFetch.add(ayId);
      this.academicYearService.getStudentYears(ayId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (studentYears) => {
            const arr = studentYears || [];
            this.studentYearsCache.set(ayId, arr);
            arr.forEach(sy => { if (sy?.id) this.studentYearIndex.set(sy.id, sy); });
            this.pendingAyFetch.delete(ayId);
            this.applyFilters();
          },
          error: (error) => {
            console.error('Error loading student years:', error);
            this.studentYearsCache.set(ayId, []);
            this.pendingAyFetch.delete(ayId);
            this.applyFilters();
          }
        });
    } else {
      this.applyFilters();
    }
  }

  selectStudentYear(syId: string | null): void {
    this.selectedStudentYearId = syId;
    this.applyFilters();
  }

  selectDifficulty(difficulty: string | null): void {
    this.selectedDifficulty = this.selectedDifficulty === difficulty ? null : difficulty;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedAcademicYearId = null;
    this.selectedStudentYearId = null;
    this.selectedDifficulty = null;
    this.searchTerm = '';
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.subjects];

    if (this.selectedAcademicYearId) {
      filtered = filtered.filter(s => s.academicYearId === this.selectedAcademicYearId);
    }

    if (this.selectedStudentYearId) {
      filtered = filtered.filter(s => s.studentYearId === this.selectedStudentYearId);
    }

    if (this.selectedDifficulty) {
      filtered = filtered.filter(s => s.difficulty === this.selectedDifficulty);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(s =>
        (s.name || '').toLowerCase().includes(term) ||
        (s.description || '').toLowerCase().includes(term)
      );
    }

    this.applySorting(filtered);
    this.filteredSubjects = filtered;

    // Ensure studentYears are available for AYs shown in the (filtered) list
    this.ensureStudentYearsForFiltered();

    // Update pagination
    this.updatePagination();
  }

  private applySorting(subjects: CourseSubject[]): void {
    subjects.sort((a, b) => {
      let cmp = 0;
      switch (this.sortBy) {
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '', 'ar');
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'popularity':
          cmp = (a.order || 0) - (b.order || 0);
          break;
        default:
          cmp = (a.name || '').localeCompare(b.name || '', 'ar');
      }
      return this.sortOrder === 'desc' ? -cmp : cmp;
    });
  }

  // Lazy-load student years only for AYs in the current list
  private ensureStudentYearsForFiltered(): void {
    const ayIdsInList = Array.from(
      new Set((this.filteredSubjects || []).map(s => s.academicYearId).filter(Boolean) as string[])
    );

    const toLoad = ayIdsInList.filter(ayId => !this.studentYearsCache.has(ayId) && !this.pendingAyFetch.has(ayId));
    if (toLoad.length === 0) return;

    toLoad.forEach(id => this.pendingAyFetch.add(id));

    const calls = toLoad.map(ayId =>
      this.academicYearService.getStudentYears(ayId).pipe(
        catchError(err => {
          console.warn('Failed to load student years for AY', ayId, err);
          return of([]);
        })
      )
    );

    forkJoin(calls)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        results.forEach((list, idx) => {
          const ayId = toLoad[idx];
          const arr = list || [];
          this.studentYearsCache.set(ayId, arr);
          arr.forEach(sy => { if (sy?.id) this.studentYearIndex.set(sy.id, sy); });
          this.pendingAyFetch.delete(ayId);
        });
      });
  }

  // Pagination
  private updatePagination(): void {
    this.totalItems = this.filteredSubjects.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get paginatedSubjects(): CourseSubject[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSubjects.slice(start, end);
  }

  // Pagination info (avoid Math in template)
  get paginationInfo(): string {
    if (this.totalItems === 0) return 'لا توجد نتائج';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end} من ${this.totalItems}`;
  }

  // UI helpers
  getAcademicYearName(ayId?: string): string {
    if (!ayId) return 'غير محدد';
    const ay = this.academicYears.find(a => a.id === ayId);
    return ay?.displayName || ay?.name || 'غير محدد';
  }

  getStudentYearName(syId?: string): string {
    if (!syId) return 'غير محدد';
    const sy = this.studentYearIndex.get(syId);
    return sy?.displayName || sy?.name || 'غير محدد';
  }

  getDifficultyLabel(difficulty?: string): string {
    switch (difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return 'غير محدد';
    }
  }

  getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
  }

  formatDuration(duration?: string): string {
    if (!duration) return 'غير محدد';
    const map: Record<string, string> = {
      '1_month': 'شهر واحد',
      '2_months': 'شهران',
      '3_months': 'ثلاثة أشهر',
      '6_months': 'ستة أشهر',
      '1_year': 'سنة واحدة',
      '1_semester': 'فصل دراسي واحد',
      '2_semesters': 'فصلان دراسيان'
    };
    return map[duration] || duration;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/imgs/avatar/avatar-1.jpg';
  }

  // Instructor fallback
  getInstructorName(subject: CourseSubject): string {
    const anySubject = subject as any;
    return anySubject?.instructor || anySubject?.instructorName || 'غير محدد';
  }

  // Role-aware navigation
  viewCourse(subject: CourseSubject): void {
    if (!subject?.id) {
      console.error('Subject ID is missing');
      return;
    }
    console.log('Navigating to course details:', subject.id);

    if (this.authService.canAccessAdmin()) {
      this.router.navigate(['/admin/course-details', subject.id]);
    } else if (this.authService.isStudent()) {
      this.router.navigate(['/student-dashboard/course-details', subject.id]);
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/courses' } });
    }
  }

  // Getters for UI
  get hasActiveFilters(): boolean {
    return !!(this.selectedAcademicYearId ||
      this.selectedStudentYearId ||
      this.selectedDifficulty ||
      this.searchTerm.trim());
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.selectedAcademicYearId) count++;
    if (this.selectedStudentYearId) count++;
    if (this.selectedDifficulty) count++;
    if (this.searchTerm.trim()) count++;
    return count;
  }

  get isEmptyState(): boolean {
    return !this.isLoading && this.subjects.length === 0;
  }

  get isNoResults(): boolean {
    return !this.isLoading && this.subjects.length > 0 && this.filteredSubjects.length === 0;
  }
}