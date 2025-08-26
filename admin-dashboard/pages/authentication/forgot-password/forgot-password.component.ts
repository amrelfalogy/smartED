import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // Form state
  currentStep = 1;
  emailForm!: FormGroup;
  codeForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // Data
  userEmail = '';
  codeDigits = ['', '', '', '', '', ''];
  
  // Error messages
  codeError = '';
  resetError = '';
  
  // UI state
  isLoading = false;
  showPassword = false;
  
  // Resend code functionality
  canResend = false;
  resendCountdown = 60;
  private countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // ===== FORM INITIALIZATION =====
  initializeForms(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // ===== STEP 1: EMAIL =====
  sendResetEmail(): void {
    if (this.emailForm.valid) {
      this.isLoading = true;
      this.resetError = '';
      
      const email = this.emailForm.get('email')?.value;
      console.log('Sending reset email to:', email);
      
      // TODO: Replace with actual API call
      // this.authService.sendResetEmail(email).subscribe({...})
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        this.userEmail = email;
        this.currentStep = 2;
        this.startResendCountdown();
      }, 2000);
    } else {
      this.emailForm.get('email')?.markAsTouched();
    }
  }

  // ===== STEP 2: VERIFICATION CODE =====
  onCodeInput(event: Event, index: number): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    // Only allow numeric input
    if (value && /^\d$/.test(value)) {
      this.codeDigits[index] = value;
      
      // Auto-focus next input
      if (index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else {
      // Clear invalid input
      this.codeDigits[index] = '';
      target.value = '';
    }
    
    this.codeError = '';
  }

  onCodeKeydown(event: KeyboardEvent, index: number): void {
    // Handle backspace
    if (event.key === 'Backspace') {
      if (!this.codeDigits[index] && index > 0) {
        // Move to previous input if current is empty
        const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      } else {
        // Clear current input
        this.codeDigits[index] = '';
      }
    }
    
    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
    
    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
    
    // Prevent non-numeric input
    if (!/[0-9]/.test(event.key) && 
        !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onCodePaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    
    const pastedData = event.clipboardData?.getData('text') || '';
    
    // Check if pasted data is exactly 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      // Fill all inputs with the pasted code
      for (let i = 0; i < 6; i++) {
        this.codeDigits[i] = pastedData[i];
        const input = document.getElementById(`code-${i}`) as HTMLInputElement;
        if (input) {
          input.value = pastedData[i];
        }
      }
      
      // Focus the last input
      const lastInput = document.getElementById('code-5') as HTMLInputElement;
      lastInput?.focus();
      
      this.codeError = '';
    } else {
      this.codeError = 'يجب أن يكون الرمز مكون من 6 أرقام فقط';
    }
  }

  onCodeFocus(event: FocusEvent, index: number): void {
    const target = event.target as HTMLInputElement;
    target.select();
  }

  isCodeComplete(): boolean {
    return this.codeDigits.every(digit => digit !== '' && /^\d$/.test(digit));
  }

  verifyCode(): void {
    if (this.isCodeComplete()) {
      this.isLoading = true;
      this.codeError = '';
      
      const code = this.codeDigits.join('');
      console.log('Verifying code:', code);
      
      // TODO: Replace with actual API call
      // this.authService.verifyResetCode(code).subscribe({...})
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        
        // Simulate success/error (replace with actual API call)
        if (code === '123456') {
          this.currentStep = 3;
        } else {
          this.codeError = 'رمز التحقق غير صحيح';
        }
      }, 1500);
    } else {
      this.codeError = 'يرجى إدخال الرمز كاملاً';
    }
  }

  // Resend code functionality
  startResendCountdown(): void {
    this.canResend = false;
    this.resendCountdown = 60;
    
    this.countdownInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.canResend = true;
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  resendCode(): void {
    console.log('Resending code to:', this.userEmail);
    
    // Clear current code
    this.clearCode();
    
    // Start countdown again
    this.startResendCountdown();
    
    // TODO: Add actual API call
    // this.authService.resendResetCode(this.userEmail).subscribe({...})
  }

  clearCode(): void {
    this.codeDigits = ['', '', '', '', '', ''];
    this.codeError = '';
    
    // Clear all input values and focus first input
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`code-${i}`) as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }
    
    const firstInput = document.getElementById('code-0') as HTMLInputElement;
    firstInput?.focus();
  }

  // ===== STEP 3: NEW PASSWORD =====
  passwordValidator = (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.value;
    if (!password) return null;

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const valid = hasUpper && hasLower && hasNumber && hasSpecial;
    return valid ? null : { invalidPassword: true };
  }

  passwordMatchValidator = (group: AbstractControl): { [key: string]: any } | null => {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  getPasswordStrength(): string {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak': return 'ضعيفة';
      case 'medium': return 'متوسطة';
      case 'strong': return 'قوية';
      default: return '';
    }
  }

  resetPassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      
      const newPassword = this.passwordForm.get('newPassword')?.value;
      console.log('Resetting password');
      
      // TODO: Replace with actual API call
      // this.authService.resetPassword(newPassword, this.verificationCode).subscribe({...})
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        this.currentStep = 4;
      }, 2000);
    } else {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
    }
  }

  // ===== STEP 4: SUCCESS =====
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // ===== VALIDATION HELPERS =====
  isFieldInvalid(fieldName: string): boolean {
    const field = this.emailForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.emailForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'هذا الحقل مطلوب';
    if (field.errors['email']) return 'البريد الإلكتروني غير صحيح';

    return 'خطأ في البيانات';
  }

  isPasswordFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getPasswordFieldError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'هذا الحقل مطلوب';
    if (field.errors['minlength']) return 'كلمة المرور قصيرة جداً';
    if (field.errors['invalidPassword']) return 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص';
    if (field.errors['passwordMismatch']) return 'كلمات المرور غير متطابقة';

    return 'خطأ في البيانات';
  }
}