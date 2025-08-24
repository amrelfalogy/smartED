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

  navigateToDashboard(): void {
    if (this.currentUser?.role === 'admin' || this.currentUser?.role === 'support') {
      this.router.navigate(['/admin/dashboard']);
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

  // Helper method to check if user has admin access
  canAccessAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'support';
  }
}