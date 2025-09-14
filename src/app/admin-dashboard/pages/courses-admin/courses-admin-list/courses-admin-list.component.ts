import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject as RxSubject, debounceTime, distinctUntilChanged, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { Subject } from 'src/app/core/models/course-complete.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { AcademicYearService } from 'src/app/core/services/academic-year.service';
import { AcademicYear, StudentYear } from 'src/app/core/models/academic-year.model';

export interface FilterOptions {
  search: string;
  status: 'all' | 'draft' | 'published';
  academicYear: 'all' | string;
  studentYear: 'all' | string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-courses-admin-list',
  templateUrl: './courses-admin-list.component.html',
  styleUrls: ['./courses-admin-list.component.scss']
})
export class CoursesAdminListComponent implements OnInit, OnDestroy {
  // ============ PROPERTIES ============
  courses: Subject[] = [];
  filteredCourses: Subject[] = [];
  academicYears: AcademicYear[] = [];
  studentYears: StudentYear[] = [];
  allStudentYears: StudentYear[] = [];
  isLoading = false;
  selectedCourses: string[] = [];
  showDeleteDialog = false;
  courseToDelete: Subject | null = null;
  errorMessage = '';
  successMessage = '';

  // ============ SEARCH & FILTER ============
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  academicYearFilter = new FormControl('all');
  studentYearFilter = new FormControl('all');
  sortControl = new FormControl('createdAt');
  sortOrderControl = new FormControl('desc');

  filters: FilterOptions = {
    search: '',
    status: 'all',
    academicYear: 'all',
    studentYear: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  // ============ PAGINATION ============
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;

  // ============ VIEW OPTIONS ============
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;

  // ============ LIFECYCLE ============
  private destroy$ = new RxSubject<void>();

  constructor(
    private subjectService: SubjectService,
    private academicYearService: AcademicYearService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ INITIALIZATION ============
  private loadInitialData(): void {
    this.isLoading = true;

    forkJoin({
      courses: this.subjectService.getAllSubjects().pipe(
        catchError(err => {
          console.error('Error loading courses:', err);
          return of([]);
        })
      ),
      academicYears: this.academicYearService.getAcademicYears().pipe(
        catchError(err => {
          console.error('Error loading AY:', err);
          return of([]);
        })
      )
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        const incoming = (data.courses || []) as Subject[];
        // Exclude soft-deleted if backend uses soft-delete
        this.courses = incoming.filter(s => !this.isSoftDeleted(s as any));
        this.academicYears = data.academicYears || [];

        if (this.academicYears.length > 0) {
          this.loadAllStudentYears(this.academicYears[0].id);
        } else {
          this.allStudentYears = [];
          this.studentYears = [];
          this.initializeFilters();
          this.applyFilters();
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading initial data:', error);
        this.errorMessage = 'حدث خطأ أثناء تحميل البيانات';
        this.isLoading = false;
      }
    });
  }

  private loadAllStudentYears(academicYearId: string): void {
    this.academicYearService.getStudentYears(academicYearId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (studentYears) => {
          this.allStudentYears = studentYears || [];
          this.studentYears = this.allStudentYears;

          this.initializeFilters();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading student years:', error);
          this.allStudentYears = [];
          this.studentYears = [];
          this.initializeFilters();
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }

  private initializeFilters(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.filters.search = search || '';
        this.currentPage = 1;
        this.applyFilters();
      });

    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.filters.status = (status || 'all') as any;
        this.currentPage = 1;
        this.applyFilters();
      });

    this.academicYearFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(academicYear => {
        this.filters.academicYear = academicYear || 'all';
        this.currentPage = 1;
        this.onAcademicYearChange(academicYear || 'all');
        this.applyFilters();
      });

    this.studentYearFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(studentYear => {
        this.filters.studentYear = studentYear || 'all';
        this.currentPage = 1;
        this.applyFilters();
      });

    this.sortControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sortBy => {
        this.filters.sortBy = (sortBy || 'createdAt') as any;
        this.applyFilters();
      });

    this.sortOrderControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sortOrder => {
        this.filters.sortOrder = (sortOrder || 'desc') as any;
        this.applyFilters();
      });
  }

  // ============ ACADEMIC YEAR HANDLING ============
  onAcademicYearChange(academicYearId: string): void {
    if (academicYearId === 'all') {
      this.studentYears = this.allStudentYears;
    } else {
      this.academicYearService.getStudentYears(academicYearId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (studentYears) => {
            this.studentYears = studentYears || [];
          },
          error: (error) => {
            console.error('Error loading student years:', error);
            this.studentYears = [];
          }
        });
    }

    this.studentYearFilter.setValue('all', { emitEvent: false });
  }

  // ============ DATA LOADING ============
  loadCourses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subjectService.getAllSubjects()
      .pipe(takeUntil(this.destroy$), catchError(err => {
        console.error('Error loading courses:', err);
        this.errorMessage = 'حدث خطأ أثناء تحميل الدورات';
        this.isLoading = false;
        return of([]);
      }))
      .subscribe((courses: Subject[]) => {
        // Exclude soft-deleted again on reload
        this.courses = (courses || []).filter(s => !this.isSoftDeleted(s as any));
        this.applyFilters();
        this.isLoading = false;
      });
  }

  // ============ FILTERING & SORTING ============
  private applyFilters(): void {
    let filtered = [...this.courses];

    // Exclude soft-deleted defensively
    filtered = filtered.filter(c => !this.isSoftDeleted(c as any));

    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm) ||
        (course.description || '').toLowerCase().includes(searchTerm)
      );
    }

    if (this.filters.status !== 'all') {
      filtered = filtered.filter(course => {
        const status = course.status || 'draft';
        return status === this.filters.status;
      });
    }

    if (this.filters.academicYear !== 'all') {
      filtered = filtered.filter(course =>
        course.academicYearId === this.filters.academicYear
      );
    }

    if (this.filters.studentYear !== 'all') {
      filtered = filtered.filter(course =>
        course.studentYearId === this.filters.studentYear
      );
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt || 0);
          bValue = new Date(b.updatedAt || 0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return this.filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredCourses = filtered;
    this.updatePagination();
  }

  // ============ PAGINATION ============
  private updatePagination(): void {
    this.totalItems = this.filteredCourses.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  get paginatedCourses(): Subject[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCourses.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ============ COURSE ACTIONS ============
  addCourse(): void {
    this.router.navigate(['admin/courses/new']);
  }

  editCourse(course: Subject): void {
    this.router.navigate(['admin/courses', course.id, 'edit']);
  }

  viewCourse(course: Subject): void {
    this.router.navigate(['admin-dashboard/courses', course.id, 'view']);
  }

  // Admin course details view
  viewCourseDetails(courseId: string): void {
    console.log('Navigating to course details:', courseId);
    this.router.navigate(['/admin/course-details', courseId]);
  }

  confirmDeleteCourse(course: Subject): void {
    this.courseToDelete = course;
    this.showDeleteDialog = true;
  }

  async deleteCourse(): Promise<void> {
    if (!this.courseToDelete?.id) {
      console.error('Course ID is missing');
      this.closeDeleteDialog();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const courseId = this.courseToDelete.id;
    const courseName = this.courseToDelete.name;

    try {
      // Call backend delete
      await this.subjectService.deleteSubject(courseId).pipe(takeUntil(this.destroy$)).toPromise();

      // Refresh from backend to ensure it really disappeared
      await this.loadCourses(); // re-pulls from server and applies filters

      // Verify deletion by trying to fetch the subject (if API available)
      try {
        const fetched = await this.subjectService.getSubject(courseId).pipe(takeUntil(this.destroy$)).toPromise();
        if (fetched) {
          // If backend returns the subject, it wasn't actually deleted (likely soft delete not applied on list)
          console.warn('Subject still exists after delete call. Backend might not be deleting.');
          this.errorMessage = 'تمت محاولة الحذف، لكن المادة ما زالت تظهر من الخادم. قد تكون هناك مشكلة في الواجهة الخلفية (Soft delete غير مُستثنى).';
        }
      } catch (e: any) {
        // If 404, that's OK — really deleted
        // Many backends return 404 after delete — treat as success
      }

      // Also optimistically remove from UI in case backend uses soft delete fields
      this.courses = this.courses.filter(c => c.id !== courseId);
      this.applyFilters();

      // Final success message (only if no error message set)
      if (!this.errorMessage) {
        this.successMessage = `تم حذف المادة "${courseName}" بنجاح`;
      }
    } catch (error: any) {
      console.error('Error deleting course:', error);

      if (error.status === 404) {
        this.successMessage = 'المادة كانت محذوفة بالفعل';
      } else if (error.status === 403) {
        this.errorMessage = 'ليس لديك صلاحية لحذف هذه المادة';
      } else if (error.status === 409) {
        this.errorMessage = 'لا يمكن حذف المادة لوجود طلاب مسجلين بها';
      } else {
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء حذف المادة. يرجى المحاولة مرة أخرى.';
      }
    } finally {
      this.isLoading = false;
      this.closeDeleteDialog();
      setTimeout(() => (this.successMessage = ''), 5000);
    }
  }

  private isSoftDeleted(s: any): boolean {
    return !!(s?.isDeleted || s?.deletedAt || s?.status === 'deleted');
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.courseToDelete = null;
  }

  // ============ SELECTION ============
  toggleCourseSelection(courseId: string): void {
    const index = this.selectedCourses.indexOf(courseId);
    if (index > -1) {
      this.selectedCourses.splice(index, 1);
    } else {
      this.selectedCourses.push(courseId);
    }
  }

  selectAllCourses(): void {
    this.selectedCourses = this.paginatedCourses.map(course => course.id!).filter(id => id);
  }

  clearSelection(): void {
    this.selectedCourses = [];
  }

  // ============ VIEW CONTROLS ============
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  resetFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusFilter.setValue('all', { emitEvent: false });
    this.academicYearFilter.setValue('all', { emitEvent: false });
    this.studentYearFilter.setValue('all', { emitEvent: false });
    this.sortControl.setValue('createdAt', { emitEvent: false });
    this.sortOrderControl.setValue('desc', { emitEvent: false });

    this.filters = {
      search: '',
      status: 'all',
      academicYear: 'all',
      studentYear: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    this.studentYears = this.allStudentYears;
    this.currentPage = 1;
    this.applyFilters();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/imgs/aboutt.jpg';
  }

  // ============ UTILITY METHODS ============
  getStatusLabel(status?: string): string {
    switch (status) {
      case 'published': return 'منشورة';
      case 'deleted': return 'محذوفة';
      case 'draft': return 'مسودة';
      default: return 'مسودة';
    }
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'published': return 'success';
      case 'deleted': return 'danger';
      case 'draft': return 'warning';
      default: return 'secondary';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'published': return 'pi pi-check-circle';
      case 'deleted': return 'pi pi-trash';
      case 'draft': return 'pi pi-clock';
      default: return 'pi pi-question-circle';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'غير محدد';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDuration(duration: string | undefined): string {
    if (!duration) return 'غير محدد';
    return duration;
  }

  getThumbnailUrl(subject: Subject): string {
    return subject.imageUrl || 'assets/imgs/aboutt.jpg';
  }

  getAcademicYearName(academicYearId?: string): string {
    if (!academicYearId) return 'غير محدد';
    const academicYear = this.academicYears.find(ay => ay.id === academicYearId);
    return academicYear?.displayName || 'غير محدد';
  }

  getStudentYearName(studentYearId?: string): string {
    if (!studentYearId) return 'غير محدد';
    const studentYear = this.allStudentYears.find(sy => sy.id === studentYearId);
    return studentYear?.displayName || 'غير محدد';
  }

  // ============ GETTERS ============
  get hasSelectedCourses(): boolean {
    return this.selectedCourses.length > 0;
  }

  get isAllSelected(): boolean {
    return this.paginatedCourses.length > 0 &&
           this.selectedCourses.length === this.paginatedCourses.length;
  }

  get filteredCoursesCount(): number {
    return this.filteredCourses.length;
  }

  get paginationInfo(): string {
    if (this.totalItems === 0) return 'لا توجد نتائج';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end} من ${this.totalItems}`;
  }

  get publishedCoursesCount(): number {
    return this.courses.filter(c => c.status === 'published').length;
  }

  get draftCoursesCount(): number {
    return this.courses.filter(c => c.status === 'draft' || !c.status).length;
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.status !== 'all') count++;
    if (this.filters.academicYear !== 'all') count++;
    if (this.filters.studentYear !== 'all') count++;
    return count;
  }
}