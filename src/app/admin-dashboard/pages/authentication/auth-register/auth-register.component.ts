// ✅ UPDATED: auth-register.component.ts - Fix Backend Phone Pattern
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-auth-register',
  templateUrl: './auth-register.component.html',
  styleUrls: ['./auth-register.component.scss']
})
export class AuthRegisterComponent implements OnInit {
  registerForm!: FormGroup;
  selectedAccountType: 'student' | 'admin' | 'support' = 'student';
  showPassword = false;
  isLoading = false;
  registerError = '';

  // Social registration options
  SignUpOptions = [
    {
      image: 'assets/imgs/google.svg',
      name: 'Google'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      // ✅ Frontend validation for Egyptian phones (for UX)
      phone: ['', [Validators.required, Validators.pattern(/^(01[0-9]{9}|(\+2|002)?01[0-9]{9})$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.registerError = '';
      
      // ✅ Transform phone number to match backend pattern
      const phoneValue = this.registerForm.value.phone;
      const transformedPhone = this.transformPhoneForBackend(phoneValue);
      
      const registerData: RegisterRequest = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        phone: transformedPhone, // ✅ Use transformed phone
        role: this.selectedAccountType
      };

      console.log('🚀 Submitting registration with transformed phone:', {
        original: phoneValue,
        transformed: transformedPhone,
        data: { ...registerData, password: '***hidden***' }
      });

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Registration successful:', response);
          this.router.navigate(['/auth/login'], {
            queryParams: { message: 'تم إنشاء الحساب بنجاح' }
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Registration failed:', error);
          this.handleRegistrationError(error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  // ✅ Transform Egyptian phone to match backend pattern
  private transformPhoneForBackend(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    console.log('📱 Transforming phone:', { original: phone, cleaned });
    
    // Handle different formats
    if (cleaned.startsWith('20')) {
      // Remove country code 20, keep the rest
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('002')) {
      // Remove 002, keep the rest
      cleaned = cleaned.substring(3);
    }
    
    // If it starts with 01 (Egyptian format), convert to international
    if (cleaned.startsWith('01')) {
      // Convert 01xxxxxxxxx to +201xxxxxxxxx (matches backend pattern)
      cleaned = '+2' + cleaned;
    } else if (cleaned.startsWith('1') && cleaned.length === 10) {
      // If it's just 1xxxxxxxxx, add +20
      cleaned = '+201' + cleaned;
    }
    
    console.log('📱 Phone transformation result:', {
      original: phone,
      final: cleaned,
      matchesBackendPattern: /^[\+]?[1-9][\d]{0,15}$/.test(cleaned)
    });
    
    return cleaned;
  }

  // ✅ Enhanced error handling
  private handleRegistrationError(error: any): void {
    if (error.error?.details && Array.isArray(error.error.details)) {
      // Handle backend validation errors
      const phoneError = error.error.details.find((detail: any) => detail.field === 'phone');
      if (phoneError) {
        const phoneControl = this.registerForm.get('phone');
        if (phoneControl) {
          phoneControl.setErrors({ 
            backend: 'صيغة رقم الهاتف غير مدعومة. حاول إضافة +2 قبل الرقم' 
          });
        }
        return;
      }
      
      // Handle other field errors
      error.error.details.forEach((detail: any) => {
        const control = this.registerForm.get(detail.field);
        if (control) {
          control.setErrors({ backend: detail.message });
        }
      });
    } else {
      this.registerError = this.getErrorMessage(error);
    }
  }

  registerWithGoogle(): void {
    console.log('Google registration clicked');
    // TODO: Implement Google OAuth
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.status === 409) {
      return 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل';
    }
    if (error.status === 400) {
      return 'بيانات غير صحيحة. يرجى المراجعة والمحاولة مرة أخرى';
    }
    if (error.status === 0) {
      return 'لا يمكن الاتصال بالخادم';
    }
    return 'حدث خطأ أثناء إنشاء الحساب';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    // ✅ Handle backend errors
    if (field.errors['backend']) return field.errors['backend'];
    if (field.errors['required']) return 'هذا الحقل مطلوب';
    if (field.errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (field.errors['minlength']) return `الحد الأدنى ${field.errors['minlength'].requiredLength} أحرف`;
    if (field.errors['pattern']) {
      if (fieldName === 'phone') {
        return 'رقم الهاتف يجب أن يكون مصري صحيح (مثال: 01012345678)';
      }
      return 'صيغة غير صحيحة';
    }
    if (field.errors['requiredTrue']) return 'يجب الموافقة على الشروط والأحكام';
    if (field.errors['passwordMismatch']) return 'كلمتا المرور غير متطابقتين';

    return 'خطأ في البيانات';
  }

  // ✅ Add phone input handler for better UX
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    // Format as user types
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Auto-add 01 if needed
    if (value.length > 0 && !value.startsWith('01')) {
      if (value.startsWith('1')) {
        value = '0' + value;
      }
    }
    
    input.value = value;
    this.registerForm.get('phone')?.setValue(value);
  }
}