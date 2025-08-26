import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Lesson } from 'src/app/core/models/course-complete.model';

@Component({
  selector: 'app-lessons-section',
  templateUrl: './lessons-section.component.html',
  styleUrls: ['./lessons-section.component.scss']
})
export class LessonsSectionComponent implements OnInit, OnDestroy {
  @Input() lessonData!: Lesson;
  @Input() unitId!: string;
  @Input() academicYearId!: string;
  @Input() studentYearId!: string;
  @Input() lessonIndex!: number;
  @Input() isEdit = false;
  @Output() lessonUpdated = new EventEmitter<Lesson>();
  @Output() lessonDeleted = new EventEmitter<void>();

  lessonForm!: FormGroup;
  isExpanded = false;
  selectedFiles: { [key: string]: File } = {};
  uploadProgress: { [key: string]: number } = {};

  // Lesson Type Configuration
  lessonTypes = [
    {
      value: 'center_recorded',
      label: 'تسجيل مركز',
      icon: 'record_voice_over',
      description: 'تسجيل من المركز التعليمي مع جودة قياسية',
      color: '#3b82f6'
    },
    {
      value: 'studio_produced',
      label: 'إنتاج استوديو',
      icon: 'video_camera_front',
      description: 'فيديو مُنتج بجودة عالية مع تحرير احترافي',
      color: '#8b5cf6'
    }
  ];

  sessionTypes = [
    { 
      value: 'recorded', 
      label: 'مسجل', 
      icon: 'videocam',
      description: 'محتوى مسجل يمكن مشاهدته في أي وقت'
    },
    { 
      value: 'live', 
      label: 'مباشر', 
      icon: 'live_tv',
      description: 'بث مباشر في وقت محدد'
    }
  ];

  difficultyOptions = [
    { 
      value: 'beginner', 
      label: 'مبتدئ', 
      icon: 'sentiment_satisfied',
      color: '#10b981',
      description: 'مناسب للمبتدئين'
    },
    { 
      value: 'intermediate', 
      label: 'متوسط', 
      icon: 'sentiment_neutral',
      color: '#f59e0b',
      description: 'يتطلب معرفة أساسية'
    },
    { 
      value: 'advanced', 
      label: 'متقدم', 
      icon: 'sentiment_very_dissatisfied',
      color: '#ef4444',
      description: 'للطلاب المتقدمين'
    }
  ];

  // Content Types
  contentTypes = [
    {
      type: 'video',
      label: 'فيديو',
      icon: 'videocam',
      accept: 'video/*',
      maxSize: 500 * 1024 * 1024 // 500MB
    },
    {
      type: 'document',
      label: 'مستند',
      icon: 'description',
      accept: '.pdf,.doc,.docx,.ppt,.pptx',
      maxSize: 50 * 1024 * 1024 // 50MB
    },
    {
      type: 'audio',
      label: 'صوت',
      icon: 'audiotrack',
      accept: 'audio/*',
      maxSize: 100 * 1024 * 1024 // 100MB
    }
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
    this.lessonForm = this.fb.group({
      id: [this.lessonData?.id || null],
      name: [this.lessonData?.name || '', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9\u0600-\u06FF\-_]+$/) // URL-friendly pattern
      ]],
      title: [this.lessonData?.title || '', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: [this.lessonData?.description || '', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]],
      lectureId: [this.lessonData?.lectureId || this.unitId],
      duration: [this.lessonData?.duration || 1800, [
        Validators.required,
        Validators.min(60), // Minimum 1 minute
        Validators.max(14400) // Maximum 4 hours
      ]],
      lessonType: [this.lessonData?.lessonType || 'center_recorded', Validators.required],
      sessionType: [this.lessonData?.sessionType || 'recorded', Validators.required],
      academicYearId: [this.lessonData?.academicYearId || this.academicYearId],
      studentYearId: [this.lessonData?.studentYearId || this.studentYearId],
      isFree: [this.lessonData?.isFree ?? false],
      difficulty: [this.lessonData?.difficulty || 'beginner', Validators.required],
      order: [this.lessonData?.order || this.lessonIndex + 1, [
        Validators.required,
        Validators.min(1)
      ]],
      isActive: [this.lessonData?.isActive ?? true],
      // Content fields
      content: this.fb.group({
        videoUrl: [this.lessonData?.content?.videoUrl || ''],
        documentUrl: [this.lessonData?.content?.documentUrl || ''],
        htmlContent: [this.lessonData?.content?.htmlContent || ''],
        attachments: [this.lessonData?.content?.attachments || []]
      })
    });

    // Auto-generate lesson name from title
    this.lessonForm.get('title')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(title => {
        if (title && !this.lessonForm.get('name')?.dirty) {
          const generatedName = this.generateLessonName(title);
          this.lessonForm.patchValue({ name: generatedName });
        }
      });
  }

  private setupFormSubscription(): void {
    this.lessonForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (this.lessonForm.valid) {
          this.lessonUpdated.emit(value as Lesson);
        }
      });
  }

  // Helper Methods
  private generateLessonName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      .substring(0, 50); // Limit length
  }

  // Duration Management
  onDurationMinutesChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const minutes = +target.value;
  
   if (minutes && minutes > 0) {
    const seconds = minutes * 60;
    this.lessonForm.patchValue({ duration: seconds });
    }
  }

  getDurationInMinutes(): number {
    const duration = this.lessonForm.get('duration')?.value || 0;
    return Math.round(duration / 60);
  }

  // File Upload Methods
  onFileSelected(event: Event, contentType: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!this.validateFile(file, contentType)) {
      return;
    }

    this.selectedFiles[contentType] = file;
    this.uploadFile(file, contentType);
  }

  private validateFile(file: File, contentType: string): boolean {
    const config = this.getContentTypeConfig(contentType);
    if (!config) return false;

    // Size validation
    if (file.size > config.maxSize) {
      alert(`حجم الملف كبير جداً. الحد الأقصى ${this.formatFileSize(config.maxSize)}`);
      return false;
    }

    // Type validation
    if (contentType === 'video') {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedVideoTypes.includes(file.type)) {
        alert('نوع الفيديو غير مدعوم. يرجى استخدام MP4, WebM, أو OGG');
        return false;
      }
    }

    if (contentType === 'document') {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const allowedDocTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
      if (!allowedDocTypes.includes(fileExtension)) {
        alert('نوع المستند غير مدعوم. يرجى استخدام PDF, DOC, DOCX, PPT, أو PPTX');
        return false;
      }
    }

    return true;
  }

  private async uploadFile(file: File, contentType: string): Promise<void> {
    this.uploadProgress[contentType] = 0;

    try {
      // Create FormData for actual upload (replace with your API call)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentType', contentType);
      formData.append('lessonId', this.lessonForm.get('id')?.value || '');
      formData.append('unitId', this.unitId);

      // Simulate upload progress (replace with actual API call)
      const uploadResult = await this.simulateFileUpload(file, contentType);
      
      // Update form with uploaded file URL
      const contentGroup = this.lessonForm.get('content') as FormGroup;
      switch (contentType) {
        case 'video':
          contentGroup.patchValue({ videoUrl: uploadResult.url });
          break;
        case 'document':
          contentGroup.patchValue({ documentUrl: uploadResult.url });
          break;
        case 'audio':
          const attachments = contentGroup.get('attachments')?.value || [];
          attachments.push({
            type: 'audio',
            url: uploadResult.url,
            name: file.name,
            size: file.size
          });
          contentGroup.patchValue({ attachments });
          break;
      }

      // Show success message
      this.showUploadSuccess(contentType, file.name);

    } catch (error) {
      console.error('File upload failed:', error);
      this.showUploadError(contentType, error);
    } finally {
      delete this.uploadProgress[contentType];
    }
  }

  private async simulateFileUpload(file: File, contentType: string): Promise<{url: string}> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        this.uploadProgress[contentType] += 10;
        if (this.uploadProgress[contentType] >= 100) {
          clearInterval(interval);
          resolve({
            url: `https://example.com/uploads/${contentType}/${file.name}`
          });
        }
      }, 200);

      // Simulate potential failure
      setTimeout(() => {
        if (Math.random() < 0.05) { // 5% chance of failure
          clearInterval(interval);
          reject(new Error('Upload failed'));
        }
      }, 1000);
    });
  }

  private showUploadSuccess(contentType: string, fileName: string): void {
    const typeLabel = this.getContentTypeConfig(contentType)?.label || contentType;
    console.log(`تم رفع ${typeLabel} بنجاح: ${fileName}`);
  }

  private showUploadError(contentType: string, error: any): void {
    const typeLabel = this.getContentTypeConfig(contentType)?.label || contentType;
    alert(`فشل في رفع ${typeLabel}. يرجى المحاولة مرة أخرى.\nالخطأ: ${error.message || 'خطأ غير معروف'}`);
  }

  removeFile(contentType: string): void {
    const config = this.getContentTypeConfig(contentType);
    const typeLabel = config?.label || contentType;

    if (confirm(`هل أنت متأكد من حذف ${typeLabel}؟`)) {
      delete this.selectedFiles[contentType];
      delete this.uploadProgress[contentType];

      const contentGroup = this.lessonForm.get('content') as FormGroup;
      switch (contentType) {
        case 'video':
          contentGroup.patchValue({ videoUrl: '' });
          break;
        case 'document':
          contentGroup.patchValue({ documentUrl: '' });
          break;
        case 'audio':
          const attachments = contentGroup.get('attachments')?.value || [];
          const filteredAttachments = attachments.filter((att: any) => att.type !== 'audio');
          contentGroup.patchValue({ attachments: filteredAttachments });
          break;
      }
    }
  }

  // Validation Methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.lessonForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.lessonForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'هذا الحقل مطلوب';
      if (field.errors['minlength']) return `الحد الأدنى ${field.errors['minlength'].requiredLength} أحرف`;
      if (field.errors['maxlength']) return `الحد الأقصى ${field.errors['maxlength'].requiredLength} حرف`;
      if (field.errors['min']) return `القيمة يجب أن تكون أكبر من ${field.errors['min'].min}`;
      if (field.errors['max']) return `القيمة يجب أن تكون أقل من ${field.errors['max'].max}`;
      if (field.errors['pattern']) return 'يرجى استخدام أحرف وأرقام وشرطات فقط';
    }
    return '';
  }

  // UI Methods
  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
  }

  deleteLesson(): void {
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      this.lessonDeleted.emit();
    }
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getContentTypeConfig(type: string) {
    return this.contentTypes.find(ct => ct.type === type);
  }

  getCompletionPercentage(): number {
    const form = this.lessonForm;
    if (!form) return 0;

    const requiredFields = [
      'title',
      'description', 
      'duration',
      'lessonType',
      'sessionType',
      'difficulty'
    ];

    const completedFields = requiredFields.filter(field => {
      const control = form.get(field);
      return control && control.valid && control.value;
    }).length;

    // Bonus points for content
    let contentBonus = 0;
    if (this.hasVideoContent) contentBonus += 1;
    if (this.hasDocumentContent) contentBonus += 1;
    if (form.get('content.htmlContent')?.value) contentBonus += 1;

    const totalPossiblePoints = requiredFields.length + 3; // 3 for content types
    const currentPoints = completedFields + contentBonus;

    return Math.round((currentPoints / totalPossiblePoints) * 100);
  }

  validateLessonData(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const form = this.lessonForm;

    if (!form.get('title')?.value) {
      errors.push('عنوان الدرس مطلوب');
    }

    if (!form.get('description')?.value) {
      errors.push('وصف الدرس مطلوب');
    }

    if (!form.get('duration')?.value || form.get('duration')?.value < 60) {
      errors.push('مدة الدرس يجب أن تكون دقيقة واحدة على الأقل');
    }

    if (!form.get('lessonType')?.value) {
      errors.push('نوع الدرس مطلوب');
    }

    if (!form.get('sessionType')?.value) {
      errors.push('نوع الجلسة مطلوب');
    }

    if (!form.get('difficulty')?.value) {
      errors.push('مستوى الصعوبة مطلوب');
    }

    // Check if at least one content type is provided
    if (!this.hasAnyContent) {
      errors.push('يجب إضافة محتوى واحد على الأقل (فيديو أو مستند أو محتوى HTML)');
    }

    return {
      isValid: errors.length === 0 && form.valid,
      errors
    };
  }

  // Getters for template
  get selectedLessonType() {
    const lessonTypeValue = this.lessonForm.get('lessonType')?.value;
    return this.lessonTypes.find(type => type.value === lessonTypeValue);
  }

  get selectedSessionType() {
    const sessionTypeValue = this.lessonForm.get('sessionType')?.value;
    return this.sessionTypes.find(type => type.value === sessionTypeValue);
  }

  get selectedDifficulty() {
    const difficultyValue = this.lessonForm.get('difficulty')?.value;
    return this.difficultyOptions.find(option => option.value === difficultyValue);
  }

  get isFormValid(): boolean {
    return this.lessonForm.valid;
  }

  get hasVideoContent(): boolean {
    return !!this.lessonForm.get('content.videoUrl')?.value;
  }

  get hasDocumentContent(): boolean {
    return !!this.lessonForm.get('content.documentUrl')?.value;
  }

  get hasAnyContent(): boolean {
    const content = this.lessonForm.get('content')?.value;
    return !!(content?.videoUrl || content?.documentUrl || content?.htmlContent || 
             (content?.attachments && content.attachments.length > 0));
  }

  get isUploadInProgress(): boolean {
    return Object.keys(this.uploadProgress).length > 0;
  }

  isUploading(contentType: string): boolean {
    return this.uploadProgress[contentType] !== undefined;
  }

  getUploadProgress(contentType: string): number {
    return this.uploadProgress[contentType] || 0;
  }
}