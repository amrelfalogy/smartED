import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { Subject as RxSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject as CourseSubject } from 'src/app/core/models/course-complete.model';
import { User } from 'src/app/core/models/user.model';
import { FileUploadService } from 'src/app/core/services/file-upload.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';

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

  // Optional: current user context
  @Input() currentUserId: string | null = null;
  @Input() currentUserRole: 'admin' | 'teacher' | 'support' | 'student' | null = null;

  @Output() subjectUpdated = new EventEmitter<CourseSubject>();

  subjectForm!: FormGroup;
  imagePreview: string | null = null;
  imageInputMode: 'upload' | 'url' = 'upload';
  isUploading = false;
  uploadProgress = 0;

  // Teachers dropdown data/search
  teachers: User[] = [];
  teacherSearch = new FormControl('');
  isLoadingTeachers = false;

  private destroy$ = new RxSubject<void>();

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.patchInitial();
    this.subscribeChanges();
    this.initTeachersIfAdmin();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.subjectForm && (changes['selectedAcademicYearId'] || changes['selectedStudentYearId'])) {
      this.subjectForm.patchValue({
        academicYearId: this.selectedAcademicYearId || '',
        studentYearId: this.selectedStudentYearId || ''
      }, { emitEvent: true });
    }
    // Auto-assign teacherId if user is a teacher
    if (this.subjectForm && this.currentUserRole === 'teacher' && this.currentUserId) {
      const existing = this.subjectForm.get('teacherId')?.value;
      if (!existing) this.subjectForm.patchValue({ teacherId: this.currentUserId }, { emitEvent: true });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    const defaultDifficulty = this.subjectData?.difficulty || 'intermediate';
    const defaultDuration = this.subjectData?.duration || '4_months';

    this.subjectForm = this.fb.group({
      name: [this.subjectData?.name || '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: [this.subjectData?.description || '', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      academicYearId: [this.subjectData?.academicYearId || this.selectedAcademicYearId || ''],
      studentYearId: [this.subjectData?.studentYearId || this.selectedStudentYearId || ''],
      difficulty: [defaultDifficulty],
      duration: [defaultDuration],
      imageUrl: [this.subjectData?.imageUrl || '', this.imageValidator()],
      order: [this.subjectData?.order || 1, [Validators.required, Validators.min(1)]],
      sessionType: [(this.subjectData as any)?.sessionType || 'recorded', [Validators.required]],
      price: [((this.subjectData as any)?.price ?? 0), [Validators.min(0)]],
      teacherId: [this.subjectData?.teacherId || '']
    });

    // If current user is a teacher, auto fill teacherId
    if (this.currentUserRole === 'teacher' && this.currentUserId && !this.subjectForm.get('teacherId')?.value) {
      this.subjectForm.patchValue({ teacherId: this.currentUserId }, { emitEvent: false });
    }
    
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
        const normalizedTeacherId = (val.teacherId ?? '').toString().trim();
        const teacherPatch = normalizedTeacherId ? { teacherId: normalizedTeacherId } : {};
        const updated: CourseSubject = {
          ...this.subjectData,
          ...val,
          ...teacherPatch,
          difficulty: val.difficulty || 'intermediate',
          duration: val.duration || '4_months',
          imageUrl: this.imagePreview || val.imageUrl,
          academicYearId: this.selectedAcademicYearId || val.academicYearId || undefined,
          studentYearId: this.selectedStudentYearId || val.studentYearId || undefined,
          status: this.subjectData.status,
          ...(val.price !== undefined ? { price: Number(val.price) } : {}),
          ...(val.sessionType ? { sessionType: val.sessionType } as any : {})
        } as any;

        if (!normalizedTeacherId && 'teacherId' in updated) {
          delete (updated as any).teacherId; // never send null
        }

        this.subjectUpdated.emit(updated);
      });
  }

  private initTeachersIfAdmin(): void {
    if (this.currentUserRole === 'admin' || this.currentUserRole === 'support') {
      this.loadTeachers('');
      this.teacherSearch.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe(q => this.loadTeachers(q || ''));
    }
  }
  

 // ✅ REPLACE: Teachers loading method
  private loadTeachers(search: string): void {
    console.log('📡 Loading teachers with search:', search);
    
    this.isLoadingTeachers = true;
    
    const params = { 
      search: search.trim(), 
      page: 1, 
      limit: 50 
    };
    
    console.log('📡 UserService.getTeachers params:', params);
    
    this.userService.getTeachers(params).subscribe({
      next: (response) => {
        console.log('✅ Teachers loaded successfully:', response);
        
        this.teachers = response.users || [];
        this.isLoadingTeachers = false;
        
        console.log('👨‍🏫 Teachers array updated:', {
          count: this.teachers.length,
          teachers: this.teachers.map(t => ({ 
            id: t.id, 
            name: this.getTeacherDisplayName(t),
            email: t.email 
          }))
        });
      },
      error: (error) => {
        console.error('❌ Failed to load teachers:', error);
        
        this.teachers = [];
        this.isLoadingTeachers = false;
        
        // Show user-friendly error
        console.error('Teachers loading error details:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
      }
    });
  }

  // ✅ ADD: Helper methods for template
  trackByTeacherId(index: number, teacher: User): string {
    return teacher.id;
  }

  getTeacherDisplayName(teacher: User): string {
    const firstName = teacher.firstName || '';
    const lastName = teacher.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) {
      return teacher.email ? `${fullName} ` : fullName;
    }
    
    return `معلم #${teacher.id.substring(0, 8)}`;
  }


  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const validation = this.fileUploadService.validateFile(file, 'image');
    if (!validation.isValid) {
      alert(validation.error || 'ملف غير صالح');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadImage(file).subscribe({
      next: (event) => {
        if ('progress' in event) {
          this.uploadProgress = event.progress;
        } else {
           let url = event.url;
          if (url && !url.startsWith('http')) {
            url = `${environment.uploadsBaseUrl}${url}`;
          }
          this.imagePreview = event.url;
          this.subjectForm.patchValue({ imageUrl: event.url });
          this.isUploading = false;
          this.uploadProgress = 100;
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        alert(error?.message || 'فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
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
    if (c.errors['min']) return 'القيمة يجب أن تكون 0 أو أكبر';
    return 'قيمة غير صالحة';
  }

  get isFormValid(): boolean {
    return this.subjectForm.valid && !!(this.imagePreview || this.subjectForm.get('imageUrl')?.value);
  }
}