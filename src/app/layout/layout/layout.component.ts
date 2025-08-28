import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isLoggingOut = false;
  currentUser: User | null = null;
  showUserDropdown = false;
  private authSubscription!: Subscription;
  private userSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('LayoutComponent: Initializing...');
    
    // Subscribe to authentication status
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        console.log('LayoutComponent: Auth status changed:', isAuth);
        this.isLoggedIn = isAuth;
        if (!isAuth) {
          this.currentUser = null;
          this.showUserDropdown = false;
        }
      }
    );

    // Subscribe to current user
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => {
        console.log('LayoutComponent: User data changed:', user);
        this.currentUser = user;
      }
    );

    // Check initial auth state
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUser = this.authService.getCurrentUser();
    
    console.log('LayoutComponent: Initial state:', {
      isLoggedIn: this.isLoggedIn,
      currentUser: this.currentUser
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  getUserDisplayName(): string {
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'المستخدم';
  }

  getUserInitials(): string {
    if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`;
    }
    return 'م';
  }

  toggleUserDropdown(): void {
    if (!this.isLoggingOut) {
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