import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { ActivationCodeService } from 'src/app/core/services/activation-code.service';
import {
  CodeActivateRequest,
  CodeActivateResponse,
  CodeValidationResult,
  ActivationAttempt
} from 'src/app/core/models/activation-code.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activation-code-input',
  templateUrl: './activation-code-input.component.html',
  styleUrls: ['./activation-code-input.component.scss'],
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ActivationCodeInputComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() lessonId?: string;
  @Input() subjectId?: string;
  @Input() placeholder = 'LMS-XXXXXXXX-XXXXXXXX';
  @Input() label = 'رمز التفعيل';
  @Input() showInstructions = true;
  @Input() autoFocus = true;
  @Input() disabled = false;
  @Input() autoNavigate = true;

  @Output() activationSuccess = new EventEmitter<CodeActivateResponse>();
  @Output() activationError = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('codeInput', { static: true }) codeInputRef!: ElementRef<HTMLInputElement>;

  codeControl = new FormControl('', [Validators.required]);
  
  // UI States
  isSubmitting = false;
  validationResult: CodeValidationResult = { isValid: false, errors: [] };
  activationAttempt: ActivationAttempt | null = null;
  
  // Success animation
  showSuccessAnimation = false;
  isNavigating = false;

  // Debug state
  debugInfo = {
    formValid: false,
    buttonDisabled: true,
    validationErrors: [] as string[],
    lastApiCall: null as Date | null,
    lastApiResponse: null as any
  };

  private destroy$ = new Subject<void>();

  constructor(
    private activationService: ActivationCodeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🔧 ActivationCodeInput: Component initializing', {
      lessonId: this.lessonId,
      subjectId: this.subjectId,
      autoNavigate: this.autoNavigate
    });
    
    this.setupValidation();
    this.setupFormatting();
    this.updateDebugInfo();
  }

  ngAfterViewInit(): void {
    if (this.autoFocus && this.codeInputRef?.nativeElement) {
      setTimeout(() => {
        this.codeInputRef.nativeElement.focus();
        console.log('🎯 Input focused');
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    this.codeControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        console.log('📝 Code input changed:', value);
        
        if (value && value.trim()) {
          this.validationResult = this.activationService.validateCodeFormat(value);
          console.log('✅ Validation result:', this.validationResult);
        } else {
          this.validationResult = { isValid: false, errors: [] };
        }
        
        // Clear previous activation attempts when code changes
        if (this.activationAttempt && this.activationAttempt.code !== value?.trim()?.toUpperCase()) {
          this.activationAttempt = null;
        }
        
        this.updateDebugInfo();
      });
  }

  private setupFormatting(): void {
    this.codeControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(100)
      )
      .subscribe(value => {
        if (value) {
          const formatted = this.activationService.formatCodeInput(value);
          if (formatted !== value) {
            this.codeControl.setValue(formatted, { emitEvent: false });
          }
        }
      });
  }

  private updateDebugInfo(): void {
    this.debugInfo = {
      formValid: this.codeControl.valid,
      buttonDisabled: this.submitButtonDisabled,
      validationErrors: this.validationResult.errors,
      lastApiCall: this.debugInfo.lastApiCall,
      lastApiResponse: this.debugInfo.lastApiResponse
    };
  }

  // ✅ FIXED: Simplified and debugged onSubmit method
  onSubmit(): void {
    console.log('🚀 === SUBMIT CLICKED ===');
    console.log('📊 Current state:', {
      codeValue: this.codeControl.value,
      formValid: this.codeControl.valid,
      isSubmitting: this.isSubmitting,
      validationResult: this.validationResult,
      buttonDisabled: this.submitButtonDisabled
    });

    // ✅ CRITICAL: Don't return early on touched state - just mark as touched
    if (!this.codeControl.value || this.codeControl.value.trim() === '') {
      console.log('❌ No code entered');
      this.codeControl.markAsTouched();
      this.updateDebugInfo();
      return;
    }

    if (this.isSubmitting) {
      console.log('❌ Already submitting, ignoring');
      return;
    }

    const code = this.codeControl.value.trim().toUpperCase();
    console.log('📝 Processing code:', code);

    // ✅ FIXED: Validate format first
    this.validationResult = this.activationService.validateCodeFormat(code);
    console.log('✅ Final validation result:', this.validationResult);

    if (!this.validationResult.isValid) {
      console.log('❌ Code format invalid, errors:', this.validationResult.errors);
      this.codeControl.markAsTouched();
      this.updateDebugInfo();
      return;
    }

    // ✅ All validations passed - proceed with API call
    console.log('✅ All validations passed, making API call...');
    this.makeActivationApiCall(code);
  }

  // ✅ NEW: Separate API call method for better debugging
  private makeActivationApiCall(code: string): void {
    console.log('📡 === MAKING API CALL ===');
    console.log('📤 Request code:', code);

    this.isSubmitting = true;
    this.debugInfo.lastApiCall = new Date();
    this.updateDebugInfo();

    this.activationAttempt = {
      code,
      isSubmitting: true,
      result: undefined
    };

    const request: CodeActivateRequest = { code };
    console.log('📦 API Request payload:', request);

    this.activationService.activateCode(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ === API CALL SUCCESS ===');
          console.log('📨 API Response:', JSON.stringify(response, null, 2));
          this.debugInfo.lastApiResponse = response;
          this.handleActivationSuccess(response);
        },
        error: (error) => {
          console.error('❌ === API CALL ERROR ===');
          console.error('📨 API Error:', error);
          this.debugInfo.lastApiResponse = error;
          this.handleActivationError(error);
        }
      });
  }

  // ✅ FIXED: Better success handling
  private handleActivationSuccess(response: CodeActivateResponse): void {
    console.log('🎯 === HANDLING ACTIVATION SUCCESS ===');
    console.log('📨 Success response:', response);
    
    this.isSubmitting = false;
    this.activationAttempt = {
      code: this.codeControl.value?.trim()?.toUpperCase() || '',
      isSubmitting: false,
      result: 'success',
      message: response.message,
      access: response.access
    };

    this.showSuccessAnimation = true;
    this.updateDebugInfo();
    
    // ✅ Emit success event
    console.log('📡 Emitting activation success event');
    this.activationSuccess.emit(response);
    this.activationService.setActivationSuccess(response);

    // ✅ Handle navigation
    const lessonId = response.accessGranted?.lessonId || response.access?.lessonId;
    console.log('🎯 Lesson ID for navigation:', lessonId);

    if (this.autoNavigate && lessonId) {
      const isInPaymentsModal = this.router.url.includes('/my-payments');
      console.log('🏛️ Is in payments modal:', isInPaymentsModal);

      if (isInPaymentsModal) {
        console.log('🚪 Closing modal first, then navigating');
        this.close.emit();
        setTimeout(() => {
          this.navigateToLesson(lessonId);
        }, 300);
      } else {
        console.log('🚀 Direct navigation');
        this.navigateToLesson(lessonId);
      }
    } else {
      console.log('⚠️ Navigation skipped', {
        autoNavigate: this.autoNavigate,
        hasLessonId: !!lessonId
      });
      
      setTimeout(() => {
        this.close.emit();
      }, 2500);
    }
  }

  // ✅ FIXED: Better error handling
  private handleActivationError(error: any): void {
    console.error('❌ === HANDLING ACTIVATION ERROR ===');
    console.error('Error details:', error);
    
    this.isSubmitting = false;
    
    let errorType: 'error' | 'expired' | 'used' | 'invalid' = 'error';
    let errorMessage = 'حدث خطأ أثناء تفعيل الرمز';

    if (error.status === 400) {
      const errorBody = error.error;
      if (errorBody?.message?.includes('expired')) {
        errorType = 'expired';
        errorMessage = 'رمز التفعيل منتهي الصلاحية';
      } else if (errorBody?.message?.includes('used') || errorBody?.message?.includes('exhausted')) {
        errorType = 'used';
        errorMessage = 'تم استخدام هذا الرمز من قبل';
      } else if (errorBody?.message?.includes('invalid') || errorBody?.message?.includes('not found')) {
        errorType = 'invalid';
        errorMessage = 'رمز التفعيل غير صحيح';
      } else {
        errorMessage = errorBody?.message || errorMessage;
      }
    } else if (error.status === 404) {
      errorType = 'invalid';
      errorMessage = 'رمز التفعيل غير موجود';
    } else if (error.status === 401) {
      errorMessage = 'يجب تسجيل الدخول أولاً';
    }

    this.activationAttempt = {
      code: this.codeControl.value?.trim()?.toUpperCase() || '',
      isSubmitting: false,
      result: errorType,
      message: errorMessage
    };

    this.updateDebugInfo();
    this.activationError.emit(errorMessage);
  }

  private navigateToLesson(lessonId: string): void {
    console.log('🚀 Navigating to lesson:', lessonId);
    this.isNavigating = true;

    if (this.activationAttempt) {
      this.activationAttempt.message = 'تم تفعيل الرمز! جاري التوجه للدرس...';
    }

    setTimeout(() => {
      const targetPath = `/student-dashboard/lesson-details/${lessonId}`;
      console.log('🎯 Navigation target:', targetPath);
      
      this.router.navigate(['/student-dashboard/lesson-details', lessonId], {
        replaceUrl: true,
        queryParams: { 
          source: 'activation',
          timestamp: Date.now()
        }
      }).then(success => {
        console.log('✅ Navigation result:', success);
        if (!success) {
          console.error('❌ Navigation failed, trying direct URL');
          window.location.href = targetPath;
        }
      }).catch(error => {
        console.error('❌ Navigation error:', error);
        window.location.href = targetPath;
      });
      
    }, 1000);
  }

  onCancel(): void {
    console.log('🚪 Cancel clicked');
    this.close.emit();
  }

  // ✅ NEW: Test method for debugging
  testCode(code: string): void {
    console.log('🧪 Testing code:', code);
    this.codeControl.setValue(code);
    this.codeControl.markAsTouched();
    this.updateDebugInfo();
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    console.log('📋 Pasted text:', pastedText);
    if (pastedText) {
      const formatted = this.activationService.formatCodeInput(pastedText);
      this.codeControl.setValue(formatted);
    }
  }

  // ✅ Template helper methods
  get hasValidationErrors(): boolean {
    return this.validationResult.errors.length > 0;
  }

  get showValidationHelp(): boolean {
    const value = this.codeControl.value;
    return typeof value === 'string' && value.length > 0 && (this.hasValidationErrors || this.codeControl.touched);
  }

  get submitButtonDisabled(): boolean {
    const disabled = !this.validationResult.isValid || this.isSubmitting || this.disabled || this.isNavigating;
    console.log('🔘 Button disabled check:', {
      validationValid: this.validationResult.isValid,
      isSubmitting: this.isSubmitting,
      disabled: this.disabled,
      isNavigating: this.isNavigating,
      result: disabled
    });
    return disabled;
  }

  get submitButtonText(): string {
    if (this.isNavigating) return 'جاري التوجه للدرس...';
    if (this.isSubmitting) return 'جاري التفعيل...';
    return 'تفعيل الرمز';
  }
}