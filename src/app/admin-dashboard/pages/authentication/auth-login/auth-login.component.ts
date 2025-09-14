import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, LoginRequest } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss']
})
export class AuthLoginComponent implements OnInit {
  loginForm!: FormGroup;
  selectedAccountType: 'student' | 'admin' | 'support' = 'student';
  showPassword = false;
  isLoading = false;
  loginError = '';

  SignInOptions = [
    {
      image: 'assets/imgs/google.svg',
      name: 'Google'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  selectAccountType(type: 'student' | 'admin' | 'support'): void {
    this.selectedAccountType = type;
    this.loginError = '';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';
      
      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
          this.redirectUser(response.user.role);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.loginError = this.getErrorMessage(error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  loginWithGoogle(): void {
    // Implement Google login functionality here
    console.log('Google login clicked');
  }

  private redirectUser(userRole: string): void {
    switch (userRole) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'support':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['student-dashboard/courses']);
        break;
    }
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.status === 401) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    }
    if (error.status === 0) {
      return 'لا يمكن الاتصال بالخادم';
    }
    return 'حدث خطأ أثناء تسجيل الدخول';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'هذا الحقل مطلوب';
    if (field.errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (field.errors['minlength']) return 'كلمة المرور قصيرة جداً';

    return 'خطأ في البيانات';
  }
}