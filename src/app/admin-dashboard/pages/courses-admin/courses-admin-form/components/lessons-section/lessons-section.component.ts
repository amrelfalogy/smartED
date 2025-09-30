import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject as RxSubject, takeUntil } from 'rxjs';
import { Lesson } from 'src/app/core/models/course-complete.model';
import { FileUploadService, FileUploadProgress, FileUploadResponse } from 'src/app/core/services/file-upload.service';

type ContentType = 'video' | 'text' | 'quiz' | 'assignment' | 'document' | 'pdf' | 'live';

@Component({
  selector: 'app-lessons-section',
  templateUrl: './lessons-section.component.html',
  styleUrls: ['./lessons-section.component.scss']
})
export class LessonsSectionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() lessonData!: Lesson;
  @Input() unitId: string = '';
  @Input() lessonIndex!: number;
  @Input() isEdit: boolean = true;
  @Input() isExpanded = false;
  @Input() academicYearId: string | null = null;
  @Input() studentYearId: string | null = null;

  @Output() lessonUpdated = new EventEmitter<Lesson>();
  @Output() lessonDeleted = new EventEmitter<string>();

  lessonForm!: FormGroup;

  // Upload states
  isLoadingMedia = false;
  uploadProgress = 0;
  isLoadingMediaDoc = false;
  uploadProgressDoc = 0;

  difficultyOptions = [
    { value: 'beginner', label: 'مبتدئ', color: '#27ae60' },
    { value: 'intermediate', label: 'متوسط', color: '#f39c12' },
    { value: 'advanced', label: 'متقدم', color: '#e74c3c' }
  ];

  lessonTypes = [
    { value: 'video', label: 'فيديو' },
    { value: 'document', label: 'مستند' },
    { value: 'pdf', label: 'PDF' },
    { value: 'text', label: 'نصي' },
    { value: 'quiz', label: 'اختبار' },
    { value: 'assignment', label: 'تكليف' },
    { value: 'live', label: 'مباشر (Zoom)' }
  ];

  private destroy$ = new RxSubject<void>();

  constructor(private fb: FormBuilder, private fileUploadService: FileUploadService) {}

  ngOnInit(): void {
    this.buildForm();
    this.patchForm(this.lessonData);
    this.subscribeChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lessonData'] && !changes['lessonData'].firstChange && this.lessonForm) {
      this.patchForm(changes['lessonData'].currentValue);
    }
    if (changes['unitId'] && this.lessonForm) {
      this.lessonForm.get('unitId')?.setValue(this.unitId || this.lessonForm.get('unitId')?.value || null, { emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    const nnb = this.fb.nonNullable;

    this.lessonForm = this.fb.group(
      {
        id: [this.lessonData?.id || null],
        unitId: [this.lessonData?.unitId || this.unitId || null, [Validators.required]],
        order: [this.lessonData?.order ?? (this.lessonIndex + 1)],
        title: [this.lessonData?.title || '', [Validators.required, Validators.minLength(3)]],
        description: [this.lessonData?.description || '', [Validators.required, Validators.minLength(10)]],
        duration: [this.lessonData?.duration ?? 0, [Validators.min(0)]],
        difficulty: [this.lessonData?.difficulty || 'beginner', Validators.required],
        lessonType: [this.lessonData?.lessonType || this.inferContentType(this.lessonData), Validators.required],

        // Media arrays for UI convenience (string-only controls)
        videos: nnb.array<string>([]),
        documents: nnb.array<string>([]),

        documentFile: [null as File | null],

        // Flags
        isFree: [this.lessonData?.isFree ?? false],
        isActive: [this.lessonData?.isActive ?? true],

        // Academic
        academicYearId: [this.lessonData?.academicYearId ?? this.academicYearId ?? null],
        studentYearId: [this.lessonData?.studentYearId ?? this.studentYearId ?? null],

        // Pricing
        price: [this.lessonData?.price ?? 0, [Validators.min(0)]],
        currency: [this.lessonData?.currency || 'EGP'],

        // Content/visual
        content: [this.lessonData?.content ?? null],
        thumbnail: [this.lessonData?.thumbnail ?? null],

        // PDF meta
        pdfFileName: [this.lessonData?.pdfFileName ?? null],
        pdfFileSize: [this.lessonData?.pdfFileSize ?? null],

        // ✅ CRITICAL FIX: Live session fields with proper initial values
        zoomUrl: [this.lessonData?.zoomUrl ?? null],
        zoomMeetingId: [this.lessonData?.zoomMeetingId ?? null],
        zoomPasscode: [this.lessonData?.zoomPasscode ?? null],
        scheduledAt: [this.lessonData?.scheduledAt ?? null]
      },
      { validators: this.contentByTypeValidator }
    );

    // ✅ Watch for lessonType changes to handle live session validation
    this.lessonForm.get('lessonType')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(lessonType => {
      this.updateValidationForLessonType(lessonType);
    });
  }

  // ✅ NEW: Update validation based on lesson type
  private updateValidationForLessonType(lessonType: string): void {
    const zoomUrlControl = this.lessonForm.get('zoomUrl');
    
    if (lessonType === 'live') {
      // Add validation for live lessons
      zoomUrlControl?.setValidators([Validators.required]);
    } else {
      // Remove validation for non-live lessons
      zoomUrlControl?.clearValidators();
    }
    
    zoomUrlControl?.updateValueAndValidity({ emitEvent: false });
  }

  // ✅ UPDATED: Content validation to include live session requirements
  private contentByTypeValidator = (group: AbstractControl): ValidationErrors | null => {
    const lt = group.get('lessonType')?.value as ContentType | undefined;
    const videos = (group.get('videos') as FormArray<FormControl<string>>)?.length || 0;
    const docs = (group.get('documents') as FormArray<FormControl<string>>)?.length || 0;
    const zoomUrl = group.get('zoomUrl')?.value;

    if (lt === 'video' && videos === 0) {
      return { contentMissing: 'video' };
    }
    if ((lt === 'pdf' || lt === 'document') && docs === 0) {
      return { contentMissing: 'document' };
    }
    if (lt === 'live' && !zoomUrl) {
      return { contentMissing: 'zoom' };
    }
    return null;
  };

  private patchForm(lesson?: Lesson): void {
    if (!lesson || !this.lessonForm) return;

    this.videosFA.clear();
    this.documentsFA.clear();

    if (lesson.videoUrl) this.videosFA.push(this.fb.nonNullable.control(lesson.videoUrl));
    if (lesson.document || lesson.pdfUrl) {
      const docUrl = lesson.document || lesson.pdfUrl || '';
      this.documentsFA.push(this.fb.nonNullable.control(docUrl));
    }

    this.lessonForm.patchValue({
      id: lesson.id ?? null,
      unitId: lesson.unitId || this.unitId || null,
      order: lesson.order ?? (this.lessonIndex + 1),
      title: lesson.title || '',
      description: lesson.description || '',
      duration: lesson.duration ?? 0,
      difficulty: lesson.difficulty || 'beginner',
      lessonType: lesson.lessonType || this.inferContentType(lesson),
      isFree: lesson.isFree ?? false,
      isActive: lesson.isActive ?? true,
      academicYearId: lesson.academicYearId ?? this.academicYearId ?? null,
      studentYearId: lesson.studentYearId ?? this.studentYearId ?? null,
      price: lesson.price ?? 0,
      currency: lesson.currency || 'EGP',
      content: lesson.content ?? null,
      thumbnail: lesson.thumbnail ?? null,
      pdfFileName: lesson.pdfFileName ?? null,
      pdfFileSize: lesson.pdfFileSize ?? null,
      // ✅ CRITICAL FIX: Properly set zoom fields
      zoomUrl: lesson.zoomUrl ?? null,
      zoomMeetingId: lesson.zoomMeetingId ?? null,
      zoomPasscode: lesson.zoomPasscode ?? null,
      scheduledAt: lesson.scheduledAt ?? null
    }, { emitEvent: false });

    // ✅ Update validation after patching
    this.updateValidationForLessonType(lesson.lessonType || 'video');
  }

  private subscribeChanges(): void {
    this.lessonForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged((a, b) => {
          return a.title === b.title && 
                a.description === b.description && 
                a.lessonType === b.lessonType &&
                a.difficulty === b.difficulty &&
                a.price === b.price &&
                a.isFree === b.isFree &&
                a.zoomUrl === b.zoomUrl &&
                a.zoomMeetingId === b.zoomMeetingId &&
                a.zoomPasscode === b.zoomPasscode;
        })
      )
      .subscribe(() => {
        this.lessonUpdated.emit(this.serializeForEmit());
      });
  }

  // Typed getters
  get videosFA(): FormArray<FormControl<string>> {
    return this.lessonForm.get('videos') as FormArray<FormControl<string>>;
  }
  get documentsFA(): FormArray<FormControl<string>> {
    return this.lessonForm.get('documents') as FormArray<FormControl<string>>;
  }

  private isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const u = new URL(url.trim());
      const isHttp = u.protocol === 'http:' || u.protocol === 'https:';
      
      if (!isHttp) return false;
      
      const videoHosts = [
        'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
        'wistia.com', 'cloudinary.com', 'amazonaws.com', 'googleapis.com'
      ];
      
      const docHosts = [
        'drive.google.com', 'dropbox.com', 'onedrive.live.com', 'box.com'
      ];
      
      const isKnownHost = videoHosts.some(host => u.hostname.includes(host)) || 
                        docHosts.some(host => u.hostname.includes(host));
      
      const hasMediaExtension = /\.(mp4|webm|ogg|mov|avi|mkv|pdf|doc|docx|txt|ppt|pptx)(\?.*)?$/i.test(u.pathname);
      
      return isKnownHost || hasMediaExtension || true;
    } catch (error) {
      console.warn('URL validation error:', error);
      return false;
    }
  }

  addVideoUrl(input: HTMLInputElement): void {
    const url = (input.value || '').trim();
    if (!url) {
      alert('يرجى إدخال رابط الفيديو');
      return;
    }
    
    if (!this.isValidUrl(url)) {
      alert('رابط الفيديو غير صالح');
      return;
    }
    
    const existingUrls = this.videosFA.value;
    if (existingUrls.includes(url)) {
      alert('هذا الرابط موجود بالفعل');
      return;
    }
    
    this.videosFA.push(this.fb.nonNullable.control(url));
    input.value = '';
    
    this.lessonForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    
    setTimeout(() => {
      this.lessonUpdated.emit(this.serializeForEmit());
    }, 0);
  }

  addDocumentUrl(input: HTMLInputElement): void {
    const url = (input.value || '').trim();
    if (!url) {
      alert('يرجى إدخال رابط المستند');
      return;
    }
    
    if (!this.isValidUrl(url)) {
      alert('رابط المستند غير صالح');
      return;
    }
    
    const existingUrls = this.documentsFA.value;
    if (existingUrls.includes(url)) {
      alert('هذا الرابط موجود بالفعل');
      return;
    }
    
    this.documentsFA.push(this.fb.nonNullable.control(url));
    input.value = '';
    
    this.lessonForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    
    setTimeout(() => {
      this.lessonUpdated.emit(this.serializeForEmit());
    }, 0);
  }

  onVideoFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const validation = this.fileUploadService.validateFile(file, 'video');
    if (!validation.isValid) {
      alert(validation.error || 'ملف فيديو غير صالح');
      return;
    }

    this.isLoadingMedia = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadVideo(file).subscribe({
      next: (ev: FileUploadProgress | FileUploadResponse) => {
        if ('progress' in ev) {
          this.uploadProgress = ev.progress;
        } else if ('url' in ev) {
          if (this.videosFA.length === 0) {
            this.videosFA.push(this.fb.nonNullable.control(ev.url));
          } else {
            this.videosFA.at(0).setValue(ev.url);
          }
          if (!this.lessonForm.get('duration')?.value && ev.duration) {
            this.lessonForm.get('duration')?.setValue(Math.round(Number(ev.duration)));
          }
          this.isLoadingMedia = false;
          this.uploadProgress = 100;
          this.lessonForm.updateValueAndValidity();
        }
      },
      error: (err) => {
        console.error('Video upload error:', err);
        alert(err?.message || 'فشل رفع الفيديو');
        this.isLoadingMedia = false;
        this.uploadProgress = 0;
      }
    });
  }
  
  // Document handling methods
  get hasExistingDocument(): boolean {
    const existingUrl = this.getExistingFileUrl();
    return !!existingUrl;
  }

  getExistingFileUrl(): string | null {
    const formUrl = this.lessonForm.get('pdfUrl')?.value;
    if (formUrl) return formUrl;
    
    const documentsArray = this.documentsFA;
    if (documentsArray && documentsArray.length > 0) {
      return documentsArray.at(0).value;
    }
    
    if (this.lessonData?.pdfUrl) return this.lessonData.pdfUrl;
    if (this.lessonData?.document) return this.lessonData.document;
    
    return null;
  }

  getExistingFileName(): string {
    const fileName = this.lessonForm.get('pdfFileName')?.value;
    if (fileName) return fileName;
    
    const url = this.getExistingFileUrl();
    if (url) {
      try {
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1];
        return filename.split('?')[0] || 'ملف PDF';
      } catch (error) {
        return 'ملف PDF';
      }
    }
    
    return 'ملف PDF';
  }

  getExistingFileSize(): number | null {
    return this.lessonForm.get('pdfFileSize')?.value || null;
  }

  formatFileSize(bytes: number | null): string {
    if (!bytes || bytes <= 0) return 'غير معروف';
    
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  clearSelectedFile(): void {
    this.lessonForm.patchValue({
      documentFile: null,
      pdfFileName: this.lessonData?.pdfFileName || null,
      pdfFileSize: this.lessonData?.pdfFileSize || null
    });
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => {
      if (input.accept === '.pdf') {
        input.value = '';
      }
    });
    
    console.log('🗑️ Cleared selected file, reverted to existing');
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    if (!file.type.includes('pdf')) {
      console.error('❌ Only PDF files are allowed');
      alert('يرجى اختيار ملف PDF فقط');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File size too large');
      alert('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
      input.value = '';
      return;
    }

    console.log('✅ Document file selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      hasExistingFile: this.hasExistingDocument,
      existingFileName: this.hasExistingDocument ? this.getExistingFileName() : null
    });

    this.lessonForm.patchValue({
      documentFile: file,
      pdfFileName: file.name,
      pdfFileSize: file.size
    });

    this.lessonForm.markAsDirty();
    this.lessonForm.updateValueAndValidity();

    setTimeout(() => {
      this.lessonUpdated.emit(this.serializeForEmit());
    }, 0);
  }

  moveVideo(i: number, dir: 'up' | 'down'): void {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= this.videosFA.length) return;
    const a = this.videosFA.at(i).value;
    const b = this.videosFA.at(j).value;
    this.videosFA.at(i).setValue(b);
    this.videosFA.at(j).setValue(a);
  }

  removeVideo(i: number): void {
    this.videosFA.removeAt(i);
    this.lessonForm.updateValueAndValidity();
  }

  removeDocument(i: number): void {
    this.documentsFA.removeAt(i);
    if (this.documentsFA.length === 0) {
      this.lessonForm.patchValue({ pdfFileName: null, pdfFileSize: null }, { emitEvent: false });
    }
    this.lessonForm.updateValueAndValidity();
  }

  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
  }

  get selectedLessonType() {
    return this.selectedLessonTypeInfo;
  }

  get selectedLessonTypeInfo() {
    const lt = this.lessonForm.get('lessonType')?.value;
    const opt = this.lessonTypes.find(o => o.value === lt);
    return opt ? { label: opt.label, color: '#3498db' } : null;
  }

  get selectedDifficulty() {
    const d = this.lessonForm.get('difficulty')?.value;
    const opt = this.difficultyOptions.find(o => o.value === d);
    return opt ? { label: opt.label, color: opt.color } : null;
  }

  get isFormValid(): boolean {
    return this.lessonForm?.valid && !this.lessonForm.errors?.['contentMissing'];
  }

  get contentMissingType(): 'video' | 'document' | 'zoom' | null {
    const e = this.lessonForm.errors?.['contentMissing'];
    return e === 'video' || e === 'document' || e === 'zoom' ? e : null;
  }

  getCompletionPercentage(): number {
    const required: Array<keyof Lesson> = ['title', 'description', 'lessonType', 'difficulty'];
    let filled = 0;
    required.forEach(k => {
      const ctrl = this.lessonForm.get(String(k));
      const val = ctrl?.value;
      if (typeof val === 'string') {
        if (val.trim().length > 0) filled++;
      } else if (val !== null && val !== undefined) {
        filled++;
      }
    });
    return Math.round((filled / required.length) * 100);
  }

  isFieldInvalid(name: string): boolean {
    const c = this.lessonForm.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getFieldError(name: string): string {
    const c = this.lessonForm.get(name);
    if (!c?.errors) return '';
    if (c.errors['required']) return 'حقل مطلوب';
    if (c.errors['minlength']) return 'النص قصير جداً';
    if (c.errors['min']) return 'القيمة منخفضة جداً';
    return 'قيمة غير صالحة';
  }

  formatDuration(seconds?: number): string {
    const s = seconds ?? 0;
    const minutes = Math.floor(s / 60);
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours} ساعة ${remaining} دقيقة` : `${hours} ساعة`;
  }

  private inferContentType(lesson?: Lesson): ContentType {
    const hasVideo = lesson?.videoUrl || (lesson?.videos && lesson.videos.length > 0);
    const hasDoc = lesson?.document || (lesson?.documents && lesson.documents.length > 0);
    const hasZoom = lesson?.zoomUrl;
    if (hasZoom) return 'live';
    if (hasVideo) return 'video';
    if (hasDoc) return 'pdf';
    return 'text';
  }

  private serializeForEmit(): Lesson {
    const v = this.lessonForm.value;
    const firstVideo = (this.videosFA.length > 0) ? this.videosFA.at(0).value : null;
    const firstDoc = (this.documentsFA.length > 0) ? this.documentsFA.at(0).value : null;

    const priceValue = v.isFree ? 0 : (Number(v.price) || 0);

    const out: Lesson = {
      id: v.id || undefined,
      unitId: v.unitId || this.unitId || undefined,
      order: v.order ?? (this.lessonIndex + 1),
      title: v.title,
      description: v.description,
      content: v.content ?? null,
      duration: Number(v.duration) || 0,
      difficulty: v.difficulty,
      lessonType: v.lessonType,
      isFree: !!v.isFree,
      isActive: !!v.isActive,
      status: 'published',
      academicYearId: v.academicYearId ?? this.academicYearId ?? null,
      studentYearId: v.studentYearId ?? this.studentYearId ?? null,
      price: priceValue,
      currency: v.currency || 'EGP',
      thumbnail: v.thumbnail ?? null,
      videoUrl: firstVideo,
      document: firstDoc,

      documentFile: v.documentFile || null,
      pdfFileName: v.pdfFileName || null,
      pdfFileSize: v.pdfFileSize || null,

      // ✅ CRITICAL FIX: Always include zoom fields for live lessons
      zoomUrl: v.lessonType === 'live' ? (v.zoomUrl || null) : null,
      zoomMeetingId: v.lessonType === 'live' ? (v.zoomMeetingId || null) : null,
      zoomPasscode: v.lessonType === 'live' ? (v.zoomPasscode || null) : null,
      scheduledAt: v.lessonType === 'live' ? (v.scheduledAt || null) : null
    };

    return out;
  }

  deleteLesson(): void {
    const id = this.lessonForm.get('id')?.value;
    if (id) this.lessonDeleted.emit(id);
  }
}