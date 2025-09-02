import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject as RxSubject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  allStudentYears: StudentYear[] = []; // Store all student years for filtering
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
  // ...existing code...
  private loadInitialData(): void {
    this.isLoading = true;
    
    forkJoin({
      courses: this.subjectService.getAllSubjects(),
      academicYears: this.academicYearService.getAcademicYears()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.courses = data.courses || [];
        this.academicYears = data.academicYears || [];
        
        // Load all student years for the first academic year if available
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
      error: (error) => {
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
  // ...existing code...

  private initializeFilters(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        this.filters.search = search || ''; // ✅ Handle null/undefined
        this.currentPage = 1;
        this.applyFilters();
      });

    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.filters.status = (status || 'all') as any; // ✅ Handle null/undefined
        this.currentPage = 1;
        this.applyFilters();
      });

    this.academicYearFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(academicYear => {
        this.filters.academicYear = academicYear || 'all'; // ✅ Handle null/undefined
        this.currentPage = 1;
        this.onAcademicYearChange(academicYear || 'all');
        this.applyFilters();
      });

    this.studentYearFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(studentYear => {
        this.filters.studentYear = studentYear || 'all'; // ✅ Handle null/undefined
        this.currentPage = 1;
        this.applyFilters();
      });

    this.sortControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sortBy => {
        this.filters.sortBy = (sortBy || 'createdAt') as any; // ✅ Handle null/undefined
        this.applyFilters();
      });

    this.sortOrderControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sortOrder => {
        this.filters.sortOrder = (sortOrder || 'desc') as any; // ✅ Handle null/undefined
        this.applyFilters();
      });
  }

  // ============ ACADEMIC YEAR HANDLING ============
  onAcademicYearChange(academicYearId: string): void {
    if (academicYearId === 'all') {
      this.studentYears = this.allStudentYears;
    } else {
      // Load student years for selected academic year
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
    
      // ✅ Fix: Ensure we pass a string, not null
      this.studentYearFilter.setValue('all', { emitEvent: false });
  }

  // ============ DATA LOADING ============
  loadCourses(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.subjectService.getAllSubjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses: Subject[]) => {
          this.courses = courses || [];
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading courses:', error);
          this.errorMessage = 'حدث خطأ أثناء تحميل الدورات';
          this.isLoading = false;
        }
      });
  }

  // ============ FILTERING & SORTING ============
  private applyFilters(): void {
    let filtered = [...this.courses];

    // Search filter
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(searchTerm) ||
        (course.description || '').toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(course => {
        const status = course.status || 'draft';
        return status === this.filters.status;
      });
    }

    // Academic Year filter
    if (this.filters.academicYear !== 'all') {
      filtered = filtered.filter(course => 
        course.academicYearId === this.filters.academicYear
      );
    }

    // Student Year filter
    if (this.filters.studentYear !== 'all') {
      filtered = filtered.filter(course => 
        course.studentYearId === this.filters.studentYear
      );
    }

    // Sort
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
    this.router.navigate(['admin-dashboard/courses', course.id, 'edit']);
  }

  viewCourse(course: Subject): void {
    this.router.navigate(['admin-dashboard/courses', course.id, 'view']);
  }

  // ✅ NEW: Admin course details view (instead of student dashboard)
 viewCourseDetails(courseId: string): void {
    console.log('Navigating to course details:', courseId); // Debug log
    this.router.navigate(['/admin/course-details', courseId]);
  }

  confirmDeleteCourse(course: Subject): void {
    this.courseToDelete = course;
    this.showDeleteDialog = true;
  }

  deleteCourse(): void {
  if (!this.courseToDelete?.id) {
    console.error('Course ID is missing');
    this.closeDeleteDialog();
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';
  
  this.subjectService.deleteSubject(this.courseToDelete.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        const courseName = this.courseToDelete!.name;
        this.successMessage = `تم حذف المادة "${courseName}" بنجاح`;
        
        // Remove course from local array to avoid reloading all data
        this.courses = this.courses.filter(c => c.id !== this.courseToDelete!.id);
        this.applyFilters(); // Refresh filtered list
        
        this.closeDeleteDialog();
        this.isLoading = false;
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error: any) => {
        console.error('Error deleting course:', error);
        
        // Handle different error types
        if (error.status === 404) {
          this.errorMessage = 'المادة المراد حذفها غير موجودة';
        } else if (error.status === 403) {
          this.errorMessage = 'ليس لديك صلاحية لحذف هذه المادة';
        } else if (error.status === 409) {
          this.errorMessage = 'لا يمكن حذف المادة لوجود طلاب مسجلين بها';
        } else {
          this.errorMessage = error.error?.message || 'حدث خطأ أثناء حذف المادة. يرجى المحاولة مرة أخرى.';
        }
        
        this.isLoading = false;
        this.closeDeleteDialog();
      }
    });
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
    // ✅ Use emitEvent: false to prevent triggering change events during reset
    this.searchControl.setValue('', { emitEvent: false });
    this.statusFilter.setValue('all', { emitEvent: false });
    this.academicYearFilter.setValue('all', { emitEvent: false });
    this.studentYearFilter.setValue('all', { emitEvent: false });
    this.sortControl.setValue('createdAt', { emitEvent: false });
    this.sortOrderControl.setValue('desc', { emitEvent: false });
    
    // ✅ Reset filters object directly
    this.filters = {
      search: '',
      status: 'all',
      academicYear: 'all',
      studentYear: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    // ✅ Reset student years to show all
    this.studentYears = this.allStudentYears;
    this.currentPage = 1;
    this.applyFilters();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/course-placeholder.jpg';
  }

  // ============ UTILITY METHODS ============
  getStatusLabel(status?: string): string {
    switch (status) {
      case 'published': return 'منشورة';
      case 'draft': return 'مسودة';
      default: return 'مسودة';
    }
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      default: return 'secondary';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'published': return 'pi pi-check-circle';
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
    return subject.imageUrl || 'assets/images/course-placeholder.jpg';
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
    const end = Math.min(start + this.itemsPerPage - 1, this.totalItems);
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