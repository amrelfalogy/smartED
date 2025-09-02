import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
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
  // ✅ ADD: Input properties for academic year data
  @Input() selectedAcademicYearId: string | null = null;
  @Input() selectedStudentYearId: string | null = null;
  @Output() subjectUpdated = new EventEmitter<CourseSubject>();

  subjectForm!: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  uploadProgress: number = 0;

  // Image input mode
  imageInputMode: 'upload' | 'url' = 'upload';

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

  // ✅ ADD: Handle changes to academic year inputs
  ngOnChanges(): void {
    if (this.subjectForm) {
      this.updateAcademicFields();
    }
  }

  private initializeForm(): void {
    this.subjectForm = this.fb.group({
      name: [this.subjectData?.name || '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: [this.subjectData?.description || '', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      difficulty: [this.subjectData?.difficulty || 'beginner', Validators.required],
      // ✅ REMOVE: Required validation for academic fields since they're handled in parent
      academicYearId: [this.subjectData?.academicYearId || this.selectedAcademicYearId || ''],
      studentYearId: [this.subjectData?.studentYearId || this.selectedStudentYearId || ''],
      duration: [this.subjectData?.duration || '', Validators.required],
      imageUrl: [this.subjectData?.imageUrl || '', this.createImageValidator()],
      order: [this.subjectData?.order || 1, [Validators.required, Validators.min(1)]]
    });

    // Set initial image preview and mode
    if (this.subjectData?.imageUrl) {
      this.imagePreview = this.subjectData.imageUrl;
      this.imageInputMode = this.subjectData.imageUrl.startsWith('http') ? 'url' : 'upload';
    }

    // ✅ UPDATE: Update academic fields initially
    this.updateAcademicFields();
  }

  // ✅ NEW: Update academic year fields from parent inputs
  private updateAcademicFields(): void {
    if (this.subjectForm) {
      this.subjectForm.patchValue({
        academicYearId: this.selectedAcademicYearId || '',
        studentYearId: this.selectedStudentYearId || ''
      }, { emitEvent: false }); // Don't emit event to prevent loops

      // Manually trigger validation update
      this.subjectForm.updateValueAndValidity();
    }
  }

  // Custom validator for image
  private createImageValidator() {
    return (control: AbstractControl) => {
      // ✅ UPDATED: More flexible image validation
      if (!this.imagePreview && !control.value) {
        return { required: true };
      }
      if (control.value && this.imageInputMode === 'url' && !this.isValidUrl(control.value)) {
        return { invalidUrl: true };
      }
      return null;
    };
  }

  // URL validation
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private setupFormSubscription(): void {
    this.subjectForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        // ✅ UPDATED: Include academic year data from parent
        const updatedSubject: CourseSubject = {
          ...this.subjectData,
          ...value,
          academicYearId: this.selectedAcademicYearId || value.academicYearId,
          studentYearId: this.selectedStudentYearId || value.studentYearId,
          imageUrl: this.imagePreview || value.imageUrl
        };
        
        // ✅ UPDATED: Always emit, let parent handle validation
        this.subjectUpdated.emit(updatedSubject);
      });
  }

  // Toggle between upload and URL input
  toggleImageInputMode(): void {
    this.imageInputMode = this.imageInputMode === 'upload' ? 'url' : 'upload';
    
    // Clear current image when switching modes
    if (this.imagePreview) {
      this.removeImage();
    }
  }

  // Handle URL input with validation
  onImageUrlChange(event: Event): void {
    const url = (event.target as HTMLInputElement).value.trim();
    
    if (url) {
      if (this.isValidUrl(url)) {
        // Test if image loads successfully
        const img = new Image();
        img.onload = () => {
          this.imagePreview = url;
          this.subjectForm.patchValue({ imageUrl: url });
        };
        img.onerror = () => {
          this.imagePreview = null;
          this.subjectForm.get('imageUrl')?.setErrors({ invalidImage: true });
        };
        img.src = url;
      } else {
        this.imagePreview = null;
        this.subjectForm.get('imageUrl')?.setErrors({ invalidUrl: true });
      }
    } else {
      this.imagePreview = null;
      this.subjectForm.patchValue({ imageUrl: '' });
    }
  }

  // Image upload methods
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
    console.log('🔄 Starting image upload...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadUrl: '/api/uploads/image'
    });

    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadImage(file).subscribe({
      next: (event) => {
        console.log('📨 Upload event received:', event);
        
        if ('progress' in event) {
          this.uploadProgress = event.progress;
          console.log(`📊 Upload progress: ${event.progress}%`);
        } else if ('url' in event) {
          console.log('✅ Upload successful:', event);
          this.imagePreview = event.url;
          this.subjectForm.patchValue({ imageUrl: event.url });
          this.isUploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (error) => {
        console.error('❌ Image upload failed:', error);
        
        let errorMessage = 'فشل في رفع الصورة. ';
        if (error.status === 0) {
          errorMessage += 'مشكلة في الاتصال بالخادم.';
        } else if (error.status === 404) {
          errorMessage += 'خدمة رفع الصور غير موجودة.';
        } else if (error.status === 413) {
          errorMessage += 'حجم الصورة كبير جداً.';
        } else if (error.status === 415) {
          errorMessage += 'نوع الملف غير مدعوم.';
        } else if (error.status === 500) {
          errorMessage += 'خطأ في الخادم الداخلي.';
        } else {
          errorMessage += `خطأ غير متوقع (${error.status}).`;
        }
        
        alert(errorMessage);
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  removeImage(): void {
    if (this.imagePreview && this.imageInputMode === 'upload') {
      this.fileUploadService.deleteFile(this.imagePreview).subscribe({
        next: () => {
          this.clearImage();
        },
        error: () => {
          alert('تعذر حذف الصورة من الخادم');
          this.clearImage(); // Still remove locally
        }
      });
    } else {
      this.clearImage();
    }
  }

  private clearImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.subjectForm.patchValue({ imageUrl: '' });
    this.subjectForm.get('imageUrl')?.updateValueAndValidity();
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
      if (field.errors['invalidUrl']) return 'رابط الصورة غير صحيح';
      if (field.errors['invalidImage']) return 'لا يمكن تحميل الصورة من هذا الرابط';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'اسم المادة',
      description: 'وصف المادة',
      difficulty: 'مستوى الصعوبة',
      duration: 'مدة الكورس',
      order: 'ترتيب المادة',
      imageUrl: 'صورة المادة'
    };
    return labels[fieldName] || fieldName;
  }

  // ✅ UPDATED: Form validity check
  get isFormValid(): boolean {
    // Check form validity plus required external data
    const formValid = this.subjectForm.valid;
    const hasImage = !!(this.imagePreview || this.subjectForm.get('imageUrl')?.value);
    
    return formValid && hasImage;
  }

  get selectedDifficulty() {
    return this.difficultyOptions.find(
      option => option.value === this.subjectForm.get('difficulty')?.value
    );
  }
}