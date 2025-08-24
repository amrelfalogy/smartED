import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject as CourseSubject } from 'src/app/core/models/course-complete.model';
import { FileUploadService, FileUploadProgress, FileUploadResponse } from 'src/app/core/services/file-upload.service';

@Component({
  selector: 'app-subject-section',
  templateUrl: './subject-section.component.html',
  styleUrls: ['./subject-section.component.scss']
})
export class SubjectSectionComponent implements OnInit, OnDestroy {
  @Input() subjectData!: CourseSubject;
  @Input() isEdit = false;
  @Output() subjectUpdated = new EventEmitter<CourseSubject>();

  subjectForm!: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  uploadProgress: number = 0;

  difficultyOptions = [
    { value: 'beginner', label: 'مبتدئ', icon: 'star', color: '#4caf50', description: 'مناسب للطلاب المبتدئين' },
    { value: 'intermediate', label: 'متوسط', icon: 'star_half', color: '#ff9800', description: 'يتطلب معرفة أساسية مسبقة' },
    { value: 'advanced', label: 'متقدم', icon: 'star_rate', color: '#f44336', description: 'للطلاب المتقدمين فقط' }
  ];

  durationOptions = [
    '1 شهر', '2 شهر', '3 شهور', '4 شهور',
    '6 شهور', '9 شهور', '1 سنة', 'مخصص'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.subjectForm = this.fb.group({
      name: [this.subjectData?.name || '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: [this.subjectData?.description || '', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      difficulty: [this.subjectData?.difficulty || 'beginner', Validators.required],
      duration: [this.subjectData?.duration || '', Validators.required],
      imageUrl: [this.subjectData?.imageUrl || ''],
      order: [this.subjectData?.order || 1, [Validators.required, Validators.min(1)]]
    });

    if (this.subjectData?.imageUrl) {
      this.imagePreview = this.subjectData.imageUrl;
    }
  }

  private setupFormSubscription(): void {
    this.subjectForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (this.subjectForm.valid) {
          const updatedSubject: CourseSubject = {
            ...this.subjectData,
            ...value,
            imageUrl: this.imagePreview || value.imageUrl
          };
          this.subjectUpdated.emit(updatedSubject);
        }
      });
  }

  // Image handling methods
  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صحيح');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      this.selectedImage = file;
      this.uploadImage(file);
    }
  }

  uploadImage(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadImage(file).subscribe({
      next: (event) => {
        if ('progress' in event) {
          this.uploadProgress = event.progress;
        } else if ('url' in event) {
          // Success: set preview and form value
          this.imagePreview = event.url;
          this.subjectForm.patchValue({ imageUrl: event.url });
          this.isUploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (error) => {
        console.error('Image upload failed:', error);
        alert('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  removeImage(): void {
    // Optionally call deleteFile if backend removes images
    if (this.imagePreview) {
      this.fileUploadService.deleteFile(this.imagePreview).subscribe({
        next: () => {
          this.selectedImage = null;
          this.imagePreview = null;
          this.subjectForm.patchValue({ imageUrl: '' });
        },
        error: () => {
          alert('تعذر حذف الصورة من الخادم');
          // Still remove locally
          this.selectedImage = null;
          this.imagePreview = null;
          this.subjectForm.patchValue({ imageUrl: '' });
        }
      });
    } else {
      this.selectedImage = null;
      this.imagePreview = null;
      this.subjectForm.patchValue({ imageUrl: '' });
    }
  }

  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.subjectForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.subjectForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} مطلوب`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} قصير جداً`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} طويل جداً`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} يجب أن يكون أكبر من 0`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'اسم المادة',
      description: 'وصف المادة',
      difficulty: 'مستوى الصعوبة',
      duration: 'مدة الكورس',
      order: 'ترتيب المادة'
    };
    return labels[fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    return this.subjectForm.valid;
  }

  get selectedDifficulty() {
    return this.difficultyOptions.find(
      option => option.value === this.subjectForm.get('difficulty')?.value
    );
  }
}