import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject as RxSubject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { Subject } from 'src/app/core/models/course-complete.model';
import { SubjectService } from 'src/app/core/services/subject.service';

export interface FilterOptions {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'draft';
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
  isLoading = false;
  selectedCourses: string[] = [];
  showDeleteDialog = false;
  courseToDelete: Subject | null = null;

  // ============ SEARCH & FILTER ============
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  sortControl = new FormControl('createdAt');
  sortOrderControl = new FormControl('desc');

  filters: FilterOptions = {
    search: '',
    status: 'all',
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeFilters();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onImageError(event: Event): void {
  const target = event.target as HTMLImageElement;
  target.src = 'assets/images/course-placeholder.jpg';
  }

  // ============ INITIALIZATION ============
  private initializeFilters(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        this.filters.search = search || '';
        this.applyFilters();
      });

    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.filters.status = status as any;
        this.applyFilters();
      });

    this.sortControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sortBy => {
        this.filters.sortBy = sortBy as any;
        this.applyFilters();
      });

    this.sortOrderControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sortOrder => {
        this.filters.sortOrder = sortOrder as any;
        this.applyFilters();
      });
  }

  // ============ DATA LOADING ============
  loadCourses(): void {
    this.isLoading = true;
    
    this.subjectService.getAllSubjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses: Subject[]) => {
          this.courses = courses;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading courses:', error);
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
        const courseStatus = this.getSubjectStatus(course);
        return courseStatus === this.filters.status;
      });
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
    
    if (this.currentPage > this.totalPages) {
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
    this.router.navigate(['admin-dashboard/courses/new']);
  }

  editCourse(course: Subject): void {
    this.router.navigate(['admin-dashboard/courses', course.id, 'edit']);
  }

  viewCourse(course: Subject): void {
    this.router.navigate(['admin-dashboard/courses', course.id, 'view']);
  }

  confirmDeleteCourse(course: Subject): void {
    this.courseToDelete = course;
    this.showDeleteDialog = true;
  }

  deleteCourse(): void {
    if (!this.courseToDelete) return;

    this.isLoading = true;
    this.subjectService.deleteSubject(this.courseToDelete.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadCourses();
          this.closeDeleteDialog();
        },
        error: (error: any) => {
          console.error('Error deleting course:', error);
          this.isLoading = false;
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
    this.selectedCourses = this.paginatedCourses.map(course => course.id!);
  }

  clearSelection(): void {
    this.selectedCourses = [];
  }

  // ============ VIEW CONTROLS ============
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('all');
    this.sortControl.setValue('createdAt');
    this.sortOrderControl.setValue('desc');
    this.currentPage = 1;
  }

  // ============ UTILITY METHODS ============
  getSubjectStatus(subject: Subject): 'active' | 'inactive' | 'draft' {
    if (subject.status) {
      return subject.status;
    }
    return subject.isActive === true ? 'active' : 
           subject.isActive === false ? 'inactive' : 'draft';
  }

  getCourseStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'draft': return 'warning';
      default: return 'secondary';
    }
  }

  getCourseStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'fas fa-play-circle';
      case 'inactive': return 'fas fa-pause-circle';
      case 'draft': return 'fas fa-edit';
      default: return 'fas fa-question-circle';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'غير محدد';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDuration(duration: string | undefined): string {
    return duration || 'غير محدد';
  }

  getStudentsCount(subject: Subject): number {
    return subject.studentsCount || 0;
  }

  getThumbnailUrl(subject: Subject): string {
    return subject.thumbnailUrl || subject.imageUrl || 'assets/images/course-placeholder.jpg';
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return 'غير محدد';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
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
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.totalItems);
    return `${start}-${end} من ${this.totalItems}`;
  }

  get activeCoursesCount(): number {
    return this.courses.filter(c => c.isActive === true).length;
  }

  get inactiveCoursesCount(): number {
    return this.courses.filter(c => c.isActive === false).length;
  }

  get draftCoursesCount(): number {
    return this.courses.filter(c => c.isActive === null || c.isActive === undefined).length;
  }
}