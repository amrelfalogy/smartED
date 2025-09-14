import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subject as RxSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject as CourseSubject } from 'src/app/core/models/course-complete.model';
import { FileUploadService } from 'src/app/core/services/file-upload.service';

@Component({
  selector: 'app-subject-section',
  templateUrl: './subject-section.component.html',
  styleUrls: ['./subject-section.component.scss']
})
export class SubjectSectionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() subjectData!: CourseSubject;
  @Input() isEdit = false;
  @Input() selectedAcademicYearId: string | null = null;
  @Input() selectedStudentYearId: string | null = null;
  @Output() subjectUpdated = new EventEmitter<CourseSubject>();

  subjectForm!: FormGroup;
  imagePreview: string | null = null;
  imageInputMode: 'upload' | 'url' = 'upload';
  isUploading = false;
  uploadProgress = 0;

  private destroy$ = new RxSubject<void>();

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.patchInitial();
    this.subscribeChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.subjectForm && (changes['selectedAcademicYearId'] || changes['selectedStudentYearId'])) {
      this.subjectForm.patchValue({
        academicYearId: this.selectedAcademicYearId || '',
        studentYearId: this.selectedStudentYearId || ''
      }, { emitEvent: true });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    // Defaults: difficulty = intermediate, duration = 4_months
    const defaultDifficulty = this.subjectData?.difficulty || 'intermediate';
    const defaultDuration = this.subjectData?.duration || '4_months';

    this.subjectForm = this.fb.group({
      name: [this.subjectData?.name || '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: [this.subjectData?.description || '', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      academicYearId: [this.subjectData?.academicYearId || this.selectedAcademicYearId || ''],
      studentYearId: [this.subjectData?.studentYearId || this.selectedStudentYearId || ''],
      difficulty: [defaultDifficulty], // hidden field
      duration: [defaultDuration],     // hidden field
      imageUrl: [this.subjectData?.imageUrl || '', this.imageValidator()],
      order: [this.subjectData?.order || 1, [Validators.required, Validators.min(1)]]
    });
  }

  private patchInitial(): void {
    if (this.subjectData?.imageUrl) {
      this.imagePreview = this.subjectData.imageUrl;
      this.imageInputMode = this.subjectData.imageUrl.startsWith('http') ? 'url' : 'upload';
    }
  }

  private subscribeChanges(): void {
    this.subjectForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const updated: CourseSubject = {
          ...this.subjectData,
          ...val,
          difficulty: val.difficulty || 'intermediate',
          duration: val.duration || '4_months',
          imageUrl: this.imagePreview || val.imageUrl,
          academicYearId: this.selectedAcademicYearId || val.academicYearId || undefined,
          studentYearId: this.selectedStudentYearId || val.studentYearId || undefined,
          status: this.subjectData.status
        };
        this.subjectUpdated.emit(updated);
      });
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة صحيحة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('الحد الأقصى لحجم الصورة 5 ميجابايت');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadImage(file).subscribe({
      next: (event) => {
        if ('progress' in event) {
          this.uploadProgress = event.progress;
        } else {
          this.imagePreview = event.url;
          this.subjectForm.patchValue({ imageUrl: event.url });
          this.isUploading = false;
          this.uploadProgress = 100;
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        alert('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  onImageUrlChange(e: Event): void {
    const url = (e.target as HTMLInputElement).value.trim();
    if (!url) {
      this.imagePreview = null;
      return;
    }
    if (!this.isValidUrl(url)) {
      this.subjectForm.get('imageUrl')?.setErrors({ invalidUrl: true });
      this.imagePreview = null;
      return;
    }
    const img = new Image();
    img.onload = () => this.imagePreview = url;
    img.onerror = () => {
      this.imagePreview = null;
      this.subjectForm.get('imageUrl')?.setErrors({ invalidImage: true });
    };
    img.src = url;
  }

  removeImage(): void {
    this.imagePreview = null;
    this.subjectForm.patchValue({ imageUrl: '' });
  }

  toggleImageInputMode(): void {
    this.imageInputMode = this.imageInputMode === 'upload' ? 'url' : 'upload';
    if (this.imageInputMode === 'url') {
      if (this.imagePreview && this.imagePreview.startsWith('data:')) {
        this.imagePreview = null;
        this.subjectForm.patchValue({ imageUrl: '' });
      }
    }
  }

  private imageValidator() {
    return (control: AbstractControl) => {
      if (!this.imagePreview && !control.value) {
        return { required: true };
      }
      if (control.value && !this.isValidUrl(control.value)) {
        return { invalidUrl: true };
      }
      return null;
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  isFieldInvalid(field: string): boolean {
    const c = this.subjectForm.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getFieldError(field: string): string {
    const c = this.subjectForm.get(field);
    if (!c?.errors) return '';
    if (c.errors['required']) return 'حقل مطلوب';
    if (c.errors['minlength']) return 'النص قصير جداً';
    if (c.errors['maxlength']) return 'النص طويل جداً';
    if (c.errors['invalidUrl']) return 'رابط غير صالح';
    if (c.errors['invalidImage']) return 'تعذر تحميل الصورة';
    return 'قيمة غير صالحة';
  }

  get isFormValid(): boolean {
    return this.subjectForm.valid && !!(this.imagePreview || this.subjectForm.get('imageUrl')?.value);
  }
}