import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ActivationCodeService } from 'src/app/core/services/activation-code.service';
import { LessonService } from 'src/app/core/services/lesson.service';
import {
  ActivationCode,
  CodeGenerateRequest,
  CodeGenerateResponse
} from 'src/app/core/models/activation-code.model';

interface ContentItem {
  id: string;
  name: string;
  type: 'lesson' | 'subject' | 'unit';
}

@Component({
  selector: 'app-code-generator-modal',
  templateUrl: './code-generator-modal.component.html',
  styleUrls: ['./code-generator-modal.component.scss']
})
export class CodeGeneratorModalComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() codeGenerated = new EventEmitter<ActivationCode>();
  @Output() codesGenerated = new EventEmitter<ActivationCode[]>(); 

  generatorForm!: FormGroup;
  
  // State
  isSubmitting = false;
  isLoadingContent = false;
  error: string | null = null;
  generatedCode: CodeGenerateResponse | null = null;
  generatedCodes: ActivationCode[] | null = null; // For multiple codes

  // Content options
  lessons: ContentItem[] = [];
  availableContent: ContentItem[] = [];
  selectedContentType: 'lesson' | 'subject' | 'unit' = 'lesson';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private activationService: ActivationCodeService,
    private lessonService: LessonService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadContent();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.generatorForm = this.fb.group({
      contentType: ['lesson', [Validators.required]],
      contentId: ['', [Validators.required]],
      description: [''],
      academicYearId: [''],
      studentYearId: [''],
      count: [1, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  private setupFormSubscriptions(): void {
    // Watch content type changes
    this.generatorForm.get('contentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.selectedContentType = type;
        this.updateAvailableContent();
        this.generatorForm.get('contentId')?.setValue('');
      });
  }

  private async loadContent(): Promise<void> {
    this.isLoadingContent = true;
    
    try {
      const lessonsResponse = await this.lessonService.getAllLessons().toPromise();

      // Process lessons
      if (Array.isArray(lessonsResponse)) {
        this.lessons = lessonsResponse.map(l => ({
          id: l.id || '',
          name: l.title || 'درس بدون عنوان',
          type: 'lesson' as const
        }));
      }

      this.updateAvailableContent();
    } catch (error) {
      console.error('Failed to load content:', error);
      this.error = 'فشل في تحميل قائمة المحتوى';
    } finally {
      this.isLoadingContent = false;
    }
  }

  private updateAvailableContent(): void {
    switch (this.selectedContentType) {
      case 'lesson':
        this.availableContent = this.lessons;
        break;
      default:
        this.availableContent = [];
    }
  }

  // ✅ FIX: Handle both single and multiple code generation
  onSubmit(): void {
    if (this.generatorForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.generatorForm.value;
    const count = parseInt(formValue.count) || 1;

    if (count === 1) {
      this.generateSingleCode();
    } else {
      this.generateMultipleCodes();
    }
  }

  // ✅ Generate single code
  private generateSingleCode(): void {
    const formValue = this.generatorForm.value;
    
    const request: CodeGenerateRequest = {
      lessonId: formValue.contentId,
      description: formValue.description?.trim() || undefined,
      academicYearId: formValue.academicYearId || undefined,
      studentYearId: formValue.studentYearId || undefined,
    };

    this.isSubmitting = true;
    this.error = null;

    this.activationService.generateCode(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.generatedCode = response;
          this.codeGenerated.emit(response.activationCode);
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to generate code:', error);
          this.error = error?.error?.message || 'فشل في إنشاء رمز التفعيل';
          this.isSubmitting = false;
        }
      });
  }

  // ✅ Generate multiple codes
  private generateMultipleCodes(): void {
    const formValue = this.generatorForm.value;
    const request = {
      lessonId: formValue.contentId,
      count: parseInt(formValue.count)
    };

    this.isSubmitting = true;
    this.error = null;

    console.log('🔄 Generating multiple codes:', request);

    this.activationService.generateMultipleCodes(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activationCodes) => {
          console.log('✅ Multiple codes generated:', activationCodes);
          this.generatedCodes = activationCodes; // Directly assign the array
          this.codesGenerated.emit(activationCodes); // Emit the array
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('❌ Failed to generate multiple codes:', error);
          this.error = error?.error?.message || 'فشل في إنشاء الرموز المتعددة';
          this.isSubmitting = false;
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }

  onStartNew(): void {
    this.generatedCode = null;
    this.generatedCodes = null;
    this.generatorForm.reset();
    this.buildForm();
  }

  copyCodeToClipboard(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      // Show success feedback if needed
    });
  }

  // ✅ NEW: Copy all generated codes at once
  copyAllCodesToClipboard(): void {
    if (!this.generatedCodes) return;

    const allCodes = this.generatedCodes
      .map(c => c.code) // Access the `code` property directly
      .join('\n');

    navigator.clipboard.writeText(allCodes).then(() => {
      console.log('✅ All codes copied to clipboard');
      // Optionally show success feedback to the user
    }).catch(() => {
      console.error('❌ Failed to copy codes to clipboard');
      // Optionally show error feedback to the user
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.generatorForm.controls).forEach(key => {
      const control = this.generatorForm.get(key);
      control?.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.generatorForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.generatorForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return 'هذا الحقل مطلوب';
    if (field.errors['min']) return `الحد الأدنى ${field.errors['min'].min}`;
    if (field.errors['max']) return `الحد الأقصى ${field.errors['max'].max}`;
    
    return 'قيمة غير صالحة';
  }

  get selectedContentName(): string {
    const contentId = this.generatorForm.get('contentId')?.value;
    const content = this.availableContent.find(c => c.id === contentId);
    return content?.name || '';
  }

  // ✅ NEW: Check if generating multiple codes
  get isGeneratingMultiple(): boolean {
    const count = this.generatorForm.get('count')?.value;
    return parseInt(count) > 1;
  }

  trackByCode(index: number, code: ActivationCode): string {
    return code.id; 
  }
  
}
