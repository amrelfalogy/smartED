// layout.component.ts - Final Updated Version
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isLoggingOut = false;
  isLoading = false; // Add loading state
  currentUser: User | null = null;
  showUserDropdown = false;
  
  private destroy$ = new Subject<void>();

  // Combined state for better management
  authState$ = combineLatest([
    this.authService.currentUser$,
    this.authService.isAuthenticated$,
    this.authService.isLoading$
  ]).pipe(
    map(([user, isAuth, loading]) => ({
      user,
      isAuthenticated: isAuth,
      isLoading: loading
    }))
  );

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('LayoutComponent: Initializing...');
    
    // Subscribe to combined auth state
    this.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('LayoutComponent: State changed:', state);
        
        this.currentUser = state.user;
        this.isLoggedIn = state.isAuthenticated;
        this.isLoading = state.isLoading;
        
        // Close dropdown if user logs out
        if (!state.isAuthenticated) {
          this.showUserDropdown = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUserDisplayName(): string {
    // Don't show fallback while loading
    if (this.isLoading) {
      return ''; // Return empty string while loading
    }
    
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    
    // Only show fallback if not loading and authenticated but no user data
    return this.isLoggedIn ? 'المستخدم' : '';
  }

  getUserInitials(): string {
    // Don't show fallback while loading
    if (this.isLoading) {
      return '';
    }
    
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`;
    }
    return this.isLoggedIn ? 'م' : '';
  }

  // Check if we should show user info (not loading and has user data)
  shouldShowUserInfo(): boolean {
    return this.isLoggedIn && !this.isLoading && this.currentUser !== null;
  }

  // Check if we should show loading state
  shouldShowLoading(): boolean {
    return this.isLoggedIn && this.isLoading;
  }

  toggleUserDropdown(): void {
    if (!this.isLoggingOut && this.shouldShowUserInfo()) {
      this.showUserDropdown = !this.showUserDropdown;
    }
  }

  closeDropdown(): void {
    this.showUserDropdown = false;
  }

  // ✅ Updated to handle both admin and student dashboard navigation
  navigateToDashboard(): void {
    if (this.currentUser?.role === 'admin' || this.currentUser?.role === 'support') {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.currentUser?.role === 'student') {
      this.router.navigate(['/student-dashboard/my-courses']);
    } else {
      this.router.navigate(['/home']);
    }
    this.closeDropdown();
  }

  logout(): void {
    if (this.isLoggingOut) return;
    
    this.isLoggingOut = true;
    this.closeDropdown();

    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.isLoggingOut = false;
        this.router.navigate(['/home']);
      }
    });
  }

  login(): void {
    this.router.navigate(['/auth/login']);
  }

  register(): void {
    this.router.navigate(['/auth/register']);
  }

  // ✅ Updated to check if user can access any dashboard (admin or student)
  canAccessDashboard(): boolean {
    return this.currentUser?.role === 'admin' || 
           this.currentUser?.role === 'support' || 
           this.currentUser?.role === 'student';
  }

  // ✅ Keep the original method for admin-specific checks
  canAccessAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'support';
  }

  // ✅ New helper method to get role label in Arabic
  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'مدير';
      case 'support':
        return 'دعم فني';
      case 'student':
        return 'طالب';
      case 'instructor':
        return 'مُدرس';
      default:
        return 'مستخدم';
    }
  }

  // ✅ New helper method to get the correct dashboard label
  getDashboardLabel(): string {
    if (this.currentUser?.role === 'admin' || this.currentUser?.role === 'support') {
      return 'لوحة التحكم';
    } else if (this.currentUser?.role === 'student') {
      return 'لوحة الطالب';
    }
    return 'لوحة التحكم';
  }

  // ✅ New helper method to get the correct dashboard icon
  getDashboardIcon(): string {
    if (this.currentUser?.role === 'admin' || this.currentUser?.role === 'support') {
      return 'pi pi-warehouse';
    } else if (this.currentUser?.role === 'student') {
      return 'pi pi-book';
    }
    return 'pi pi-warehouse';
  }
}