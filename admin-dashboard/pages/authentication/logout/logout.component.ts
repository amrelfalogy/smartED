import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {
  isLoading = false;
  message = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.logout();
  }

  logout(): void {
    this.isLoading = true;
    this.message = 'جاري تسجيل الخروج...';

    this.authService.logout().subscribe({
      next: () => {
        this.isLoading = false;
        this.message = 'تم تسجيل الخروج بنجاح';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: () => {
        this.isLoading = false;
        this.message = 'تم تسجيل الخروج';
        // Force logout even if API call fails
        localStorage.removeItem('authToken');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      }
    });
  }

  redirectToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}