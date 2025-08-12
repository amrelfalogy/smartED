import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
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
  currentUser: any = null;
  showUserDropdown = false;
  private authSubscription!: Subscription;
  private userSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
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
        this.currentUser = user;
      }
    );

    // Check initial auth status
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn && !this.currentUser) {
      this.authService.getProfile().subscribe({
        error: () => {
          // If profile fetch fails, logout user
          this.authService['handleLogout']();
        }
      });
    }
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
    if (this.currentUser) {
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

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }

  navigateToDashboard(): void {
    if (this.currentUser?.role === 'admin') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/home']);
    }
    this.closeDropdown();
  }

    // Direct logout without navigation to logout component
  logout(): void {
    if (this.isLoggingOut) return;
    
    this.isLoggingOut = true;
    this.closeDropdown();

    // Show loading state
    const originalText = 'تسجيل الخروج';
    
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/home']);
      },
      error: () => {
        this.isLoggingOut = false;
        // Force logout even if API call fails
        this.authService['handleLogout']();
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
}