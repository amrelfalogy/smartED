import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ActivationCodeService } from 'src/app/core/services/activation-code.service';
import { SubjectService } from 'src/app/core/services/subject.service';
import { LessonService } from 'src/app/core/services/lesson.service';
import { UnitService } from 'src/app/core/services/unit.service';
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

  generatorForm!: FormGroup;
  
  // State
  isSubmitting = false;
  isLoadingContent = false;
  error: string | null = null;
  generatedCode: CodeGenerateResponse | null = null;

  // Content options
  subjects: ContentItem[] = [];
  lessons: ContentItem[] = [];
  units: ContentItem[] = [];
  
  selectedContentType: 'lesson' | 'subject' | 'unit' = 'lesson';
  availableContent: ContentItem[] = [];

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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    this.generatorForm = this.fb.group({
      contentType: ['lesson', [Validators.required]],
      contentId: ['', [Validators.required]],
      description: [''],
      academicYearId: [''],
      studentYearId: ['']
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
      // Load all content types in parallel
      const [ lessonsResponse] = await Promise.all([
        this.lessonService.getAllLessons().toPromise()
      ]);

    

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

  onSubmit(): void {
    if (this.generatorForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.generatorForm.value;
    
    const request: CodeGenerateRequest = {
      lessonId: formValue.contentId,
      description: formValue.description?.trim() || undefined,
      academicYearId: formValue.academicYearId || undefined,
      studentYearId: formValue.studentYearId || undefined,
    };

    // Set content ID based on type
    switch (formValue.contentType) {
      case 'lesson':
        request.lessonId = formValue.contentId;
        break;
      case 'subject':
        request.subjectId = formValue.contentId;
        break;
      case 'unit':
        request.unitId = formValue.contentId;
        break;
    }

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

  onClose(): void {
    this.close.emit();
  }

  onStartNew(): void {
    this.generatedCode = null;
    this.generatorForm.reset();
    this.buildForm();
  }

  copyCodeToClipboard(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      // You could show a temporary success message here
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
}