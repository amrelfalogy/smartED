import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom, Subject as RxSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Lesson } from 'src/app/core/models/course-complete.model';
import { FileUploadProgress, FileUploadResponse, FileUploadService } from 'src/app/core/services/file-upload.service';
import { LessonService } from 'src/app/core/services/lesson.service';

@Component({
  selector: 'app-lessons-section',
  templateUrl: './lessons-section.component.html',
  styleUrls: ['./lessons-section.component.scss']
})
export class LessonsSectionComponent implements OnInit, OnDestroy {
  @Input() lessonData!: Lesson;
  @Input() unitId!: string;
  @Input() lessonIndex!: number;
  @Input() isEdit = false;
  @Output() lessonUpdated = new EventEmitter<Lesson>();
  @Output() lessonDeleted = new EventEmitter<void>();

  lessonForm!: FormGroup;
  isExpanded = false;
  isLoadingMedia = false;

  private destroy$ = new RxSubject<void>();
  private mediaLoadedOnce = false;

  lessonTypes = [
    { value: 'center_recorded', label: 'تسجيل مركز', icon: 'record_voice_over', color: '#3b82f6' },
    { value: 'studio_produced', label: 'إنتاج استوديو', icon: 'video_camera_front', color: '#8b5cf6' },
    { value: 'zoom', label: 'اجتماع مباشر', icon: 'videocam', color: '#0ea5e9' },
    { value: 'document', label: 'مستند', icon: 'description', color: '#64748b' }
  ];

  sessionTypes = [
    { value: 'recorded', label: 'مسجل', icon: 'play_circle' },
    { value: 'live', label: 'مباشر', icon: 'live_tv' }
  ];

  difficultyOptions = [
    { value: 'beginner', label: 'مبتدئ', icon: 'sentiment_satisfied', color: '#10b981' },
    { value: 'intermediate', label: 'متوسط', icon: 'sentiment_neutral', color: '#f59e0b' },
    { value: 'advanced', label: 'متقدم', icon: 'sentiment_very_dissatisfied', color: '#ef4444' }
  ];

  get selectedLessonType() {
    const v = this.lessonForm.get('lessonType')?.value;
    return this.lessonTypes.find(t => t.value === v);
  }
  get selectedDifficulty() {
    const v = this.lessonForm.get('difficulty')?.value;
    return this.difficultyOptions.find(d => d.value === v);
  }

  get videosFA(): FormArray {
    return this.lessonForm.get('videos') as FormArray;
  }
  get documentsFA(): FormArray {
    return this.lessonForm.get('documents') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.buildForm();

    // Ensure unitId control is filled from parent when empty
    const currentUnitId = this.lessonForm.get('unitId')?.value;
    if (!currentUnitId && this.unitId) {
      this.lessonForm.patchValue({ unitId: this.unitId }, { emitEvent: false });
    }

    this.lessonForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (this.lessonForm.valid) {
          const value: Lesson = {
            ...val,
            unitId: this.unitId || val.unitId || val.lectureId,
            videos: (this.videosFA.value || []),
            documents: (this.documentsFA.value || [])
          };
          this.lessonUpdated.emit(value);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.lessonForm = this.fb.group({
      id: [this.lessonData?.id],
      unitId: [this.lessonData?.unitId || this.lessonData?.lectureId || this.unitId || ''],
      lectureId: [this.lessonData?.lectureId || ''],
      title: [this.lessonData?.title || '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: [this.lessonData?.description || '', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      duration: [this.lessonData?.duration ?? 0, [Validators.min(0)]],
      lessonType: [this.lessonData?.lessonType || 'center_recorded', Validators.required],
      sessionType: [this.lessonData?.sessionType || 'recorded', Validators.required],
      difficulty: [this.lessonData?.difficulty || 'beginner', Validators.required],
      isFree: [this.lessonData?.isFree ?? false],
      isActive: [this.lessonData?.isActive ?? true],
      order: [this.lessonData?.order ?? this.lessonIndex, [Validators.required]],
      videos: this.fb.array((this.lessonData?.videos || []).map(v => this.fb.control(v, [Validators.required]))),
      documents: this.fb.array((this.lessonData?.documents || []).map(d => this.fb.control(d)))
    });
  }

  async loadMediaOnce(): Promise<void> {
    if (!this.lessonForm.get('id')?.value || this.mediaLoadedOnce) return;
    this.isLoadingMedia = true;
    try {
      const res = await firstValueFrom(this.lessonService.getLesson(this.lessonForm.get('id')?.value));
      // In your backend, media come as arrays at root of response
      const videos = (res as any)?.videos || [];
      const documents = (res as any)?.documents || [];

      this.videosFA.clear();
      (videos as any[]).forEach((u: any) => this.videosFA.push(this.fb.control(typeof u === 'string' ? u : u?.url, [Validators.required])));

      this.documentsFA.clear();
      (documents as any[]).forEach((u: any) => this.documentsFA.push(this.fb.control(typeof u === 'string' ? u : u?.url)));
      this.mediaLoadedOnce = true;
    } catch (e) {
      console.warn('Failed to load lesson media', e);
    } finally {
      this.isLoadingMedia = false;
    }
  }

  // Media add/remove helpers (unchanged)
  addVideoUrl(input: HTMLInputElement): void {
    const url = (input.value || '').trim();
    if (!url) return;
    this.videosFA.push(this.fb.control(url, [Validators.required]));
    input.value = '';
    this.touchAndValidate();
  }
  removeVideo(i: number): void {
    this.videosFA.removeAt(i);
    this.touchAndValidate();
  }
  moveVideo(i: number, dir: 'up' | 'down'): void {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= this.videosFA.length) return;
    const ctrl = this.videosFA.at(i);
    this.videosFA.removeAt(i);
    this.videosFA.insert(j, ctrl);
    this.touchAndValidate();
  }
  onVideoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileUploadService.uploadVideo(file).subscribe({
      next: (evt: FileUploadResponse | FileUploadProgress) => {
        if ('progress' in evt) return;
        const url = evt.url;
        if (url) {
          this.videosFA.push(this.fb.control(url, [Validators.required]));
          this.touchAndValidate();
        }
      },
      error: (err) => {
        console.error('Video upload error', err);
        alert((err as Error).message || 'تعذر رفع الفيديو');
      }
    });
  }
  onDocumentFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileUploadService.uploadDocument(file).subscribe({
      next: (evt: FileUploadResponse | FileUploadProgress) => {
        if ('progress' in evt) return;
        const url = evt.url;
        if (url) {
          this.documentsFA.push(this.fb.control(url));
          this.touchAndValidate();
        }
      },
      error: (err) => {
        console.error('Document upload error', err);
        alert((err as Error).message || 'تعذر رفع المستند');
      }
    });
  }
  removeDocument(i: number): void {
    this.documentsFA.removeAt(i);
    this.touchAndValidate();
  }

  private touchAndValidate(): void {
    this.lessonForm.markAsDirty();
    this.lessonForm.updateValueAndValidity();
  }

  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) this.loadMediaOnce();
  }

  deleteLesson(): void {
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      this.lessonDeleted.emit();
    }
  }

  isFieldInvalid(field: string): boolean {
    const c = this.lessonForm.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getFieldError(field: string): string {
    const c = this.lessonForm.get(field);
    if (!c?.errors) return '';
    if (c.errors['required']) return 'هذا الحقل مطلوب';
    if (c.errors['minlength']) return `الحد الأدنى ${c.errors['minlength'].requiredLength} حروف`;
    if (c.errors['maxlength']) return `الحد الأقصى ${c.errors['maxlength'].requiredLength} حروف`;
    if (c.errors['min']) return `القيمة أقل من المسموح`;
    return 'قيمة غير صالحة';
  }

  formatDuration(seconds: number): string {
    const h = Math.floor((seconds || 0) / 3600);
    const m = Math.floor(((seconds || 0) % 3600) / 60);
    const s = (seconds || 0) % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  getCompletionPercentage(): number {
    const required = ['title', 'description', 'lessonType', 'sessionType', 'difficulty'];
    const done = required.filter(r => {
      const ctrl = this.lessonForm.get(r);
      return ctrl && ctrl.valid && ctrl.value;
    }).length;
    return Math.round((done / required.length) * 100);
  }

  get isFormValid(): boolean {
    return this.lessonForm.valid;
  }
}