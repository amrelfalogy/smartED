import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AuthService, User } from '../../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header-right',
  templateUrl: './header-right.component.html',
  styleUrls: ['./header-right.component.scss']
})
export class HeaderRightComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoggedIn = false;
  isLoggingOut = false;
  showUserDropdown = false;
  private authSubscription!: Subscription;
  private userSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.header-user-profile')) {
      this.closeDropdown();
    }
  }

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isLoggedIn = isAuth;
        if (!isAuth) {
          this.currentUser = null;
          this.closeDropdown();
        }
      }
    );

    // Subscribe to current user
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
        console.log('Header: Current user updated:', user);
      }
    );
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

  getUserRole(): string {
    if (!this.currentUser) return '';
    
    switch (this.currentUser.role) {
      case 'admin':
        return 'مدير النظام';
      case 'support':
        return 'دعم فني';
      case 'student':
        return 'طالب';
      default:
        return 'مستخدم';
    }
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
    this.router.navigate(['/admin/profile']);
    this.closeDropdown();
  }

  editProfile(): void {
    this.router.navigate(['/admin/profile/edit']);
    this.closeDropdown();
  }

  navigateToSettings(): void {
    this.router.navigate(['/admin/settings']);
    this.closeDropdown();
  }
  navigateToHome(): void {
    this.router.navigate(['/home']);
    this.closeDropdown();
  }
  navigateToSupport(): void {
    this.router.navigate(['/support-me']);
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
        // Force logout even if API fails
        this.router.navigate(['/home']);
      }
    });
  }
}