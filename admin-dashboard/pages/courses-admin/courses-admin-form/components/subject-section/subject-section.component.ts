import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject as CourseSubject } from '../../../../../core/models/course-complete.model';
import { FileUploadService, FileUploadResponse, FileUploadProgress } from '../../../../../core/services/file-upload.service';

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

  difficultyOptions = [
    { 
      value: 'beginner', 
      label: 'مبتدئ', 
      icon: 'star', 
      color: '#4caf50',
      description: 'مناسب للطلاب المبتدئين'
    },
    { 
      value: 'intermediate', 
      label: 'متوسط', 
      icon: 'star_half', 
      color: '#ff9800',
      description: 'يتطلب معرفة أساسية مسبقة'
    },
    { 
      value: 'advanced', 
      label: 'متقدم', 
      icon: 'star_rate', 
      color: '#f44336',
      description: 'للطلاب المتقدمين فقط'
    }
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
      name: [this.subjectData?.name || '', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: [this.subjectData?.description || '', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]],
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صحيح');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      this.selectedImage = file;
      this.previewImage(file);
      this.uploadImage(file);
    }
  }

  previewImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      this.subjectForm.patchValue({ imageUrl: this.imagePreview });
    };
    reader.readAsDataURL(file);
  }

  async uploadImage(file: File): Promise<void> {
    this.isUploading = true;
    
    try {
      this.fileUploadService.uploadImage(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (event) => {
            if ('url' in event) {
              // Upload completed successfully
              const response = event as FileUploadResponse;
              this.subjectForm.patchValue({ imageUrl: response.url });
              this.imagePreview = response.url;
              this.isUploading = false;
            }
            // Progress events are handled automatically by the UI
          },
          error: (error) => {
            console.error('Image upload failed:', error);
            alert('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
            this.isUploading = false;
          }
        });
      
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
      this.isUploading = false;
    }
  }

  removeImage(): void {
    const currentImageUrl = this.subjectForm.get('imageUrl')?.value;
    
    // If there's a URL from a previous upload, delete it from the server
    if (currentImageUrl && currentImageUrl.startsWith('http')) {
      this.fileUploadService.deleteFile(currentImageUrl)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Image deleted successfully from server');
          },
          error: (error) => {
            console.error('Failed to delete image from server:', error);
            // Continue with local cleanup even if server deletion fails
          }
        });
    }
    
    // Clean up local state
    this.selectedImage = null;
    this.imagePreview = null;
    this.subjectForm.patchValue({ imageUrl: '' });
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