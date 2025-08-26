import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject as CourseSubject } from 'src/app/core/models/course-complete.model';

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

  constructor(private fb: FormBuilder) {}

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
      // Here you would implement actual file upload to your backend
      const formData = new FormData();
      formData.append('image', file);
      
      // Simulate upload for now - replace with actual upload service
      await new Promise(resolve => setTimeout(resolve, 2000));
      const uploadedUrl = `https://example.com/uploads/${file.name}`;
      
      this.subjectForm.patchValue({ imageUrl: uploadedUrl });
      this.imagePreview = uploadedUrl;
      
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      this.isUploading = false;
    }
  }

  removeImage(): void {
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