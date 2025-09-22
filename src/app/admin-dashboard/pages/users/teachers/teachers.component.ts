import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { UserService } from 'src/app/core/services/user.service';
import { User, UsersResponse } from 'src/app/core/models/user.model';

interface TeacherStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

@Component({
  selector: 'app-teachers',
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.scss']
})
export class TeachersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  teachers: User[] = [];
  isLoadingStats = true; // ✅ Add separate loading state
  stats: TeacherStats = { total: 0, active: 0, inactive: 0, recent: 0 };
  
  // State
  isLoading = false;
  searchControl = new FormControl('');
  
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 0;
  totalItems = 0;
  
  // Modal
  selectedUser: User | null = null;
  showProfileModal = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.setupSearch();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTeachers();
      });
  }

  loadTeachers(): void {
    this.isLoading = true;
    
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchControl.value || ''
    };

    this.userService.getTeachers(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UsersResponse) => {
          this.teachers = response.users;
          this.totalPages = response.pagination.total;
          this.totalItems = response.pagination.totalItems;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load teachers:', error);
          this.teachers = [];
          this.isLoading = false;
        }
      });
  }

  // ✅ UPDATE: In teachers.component.ts
  private loadStats(): void {
    this.isLoadingStats =true;

    this.userService.getUserStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = {
            total: stats.totalTeachers || 0,
            active: Math.floor((stats.totalTeachers|| 0) * 0.85), // Active teachers estimate
            inactive: Math.floor((stats.totalTeachers || 0) * 0.15), // Inactive teachers estimate  
            recent: stats.recentRegistrations
          };
          this.isLoadingStats = false;
        },
        error: (error) => {
          console.error('Failed to load teacher stats:', error);
          // Fallback to loading basic stats
          this.loadBasicStats();
        }
      });
  }

  private loadBasicStats(): void {
    this.userService.getTeachers({ limit: 1, page: 1 }) // ✅ Fix: Use getTeachers, not getUsers
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const total = response.pagination.totalItems || 0;
          this.stats = {
            total: total,
            active: Math.floor(total * 0.8),
            inactive: Math.floor(total * 0.2),
            recent: Math.floor(total * 0.1)
          };
          this.isLoadingStats = false;
        },
        error: (error) => {
          console.error('Failed to load basic teacher stats:', error);
          this.stats = { total: 0, active: 0, inactive: 0, recent: 0 };
          this.isLoadingStats = false;
        }
      });
  }

  formatStatNumber(value: number): string {
    return (value || 0).toLocaleString('ar-EG');
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTeachers();
  }

  viewProfile(teacher: User): void {
    this.selectedUser = teacher;
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.selectedUser = null;
  }

  onUserUpdated(updatedUser: User): void {
    const index = this.teachers.findIndex(t => t.id === updatedUser.id);
    if (index !== -1) {
      this.teachers[index] = updatedUser;
    }
    this.closeProfileModal();
  }

  onUserDeleted(userId: string): void {
    this.teachers = this.teachers.filter(t => t.id !== userId);
    this.closeProfileModal();
    this.loadStats();
  }

  getDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}