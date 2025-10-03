import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject as RxSubject, takeUntil, firstValueFrom } from 'rxjs';
import { Lesson, Subject as CourseSubject } from 'src/app/core/models/course-complete.model';
import { LessonService } from 'src/app/core/services/lesson.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SubjectService } from 'src/app/core/services/subject.service';
import { ActivationCodeService } from 'src/app/core/services/activation-code.service';
import { CodeActivateResponse } from 'src/app/core/models/activation-code.model';
import { environment } from 'src/environments/environment';

// ✅ NEW: Import our security and video services
import { PageSecurityService } from 'src/app/core/services/page-security.service';
import { VideoIdExtractorService } from 'src/app/core/services/video-id-extractor.service';
import { VideoPlayerEvent, VideoPlayerConfig } from 'src/app/shared/video-player/video-player.component';

@Component({
  selector: 'app-lesson-details',
  templateUrl: './lesson-details.component.html',
  styleUrls: ['./lesson-details.component.scss']
})
export class LessonDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new RxSubject<void>();

  // Route params
  lessonId = '';
  fromCourse = '';

  // Data
  lesson: Lesson | null = null;
  courseInfo: CourseSubject | null = null;

  // States
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Role flags
  isAdminOrSupport = false;
  isAdminMode = false;

  // Access flags
  hasAccess = false;
  requiresPayment = false;

  showPdfViewer = false;

  // Content data
  videoUrls: string[] = [];
  docUrls: string[] = [];

  // ✅ NEW: Video player configuration
  videoPlayerConfig: VideoPlayerConfig = {
    autoplay: false,
    controls: true,
    showInfo: false,
    modestBranding: true,
    relatedVideos: false,
    keyboardDisabled: true
  };

  // UI state
  activeTab: 'video' | 'document' | 'quiz' = 'video';
  isVideoLoading = false;
  currentVideoIndex = 0;
  isVideoPlaying = false;

  // ✅ NEW: Security state
  securityEnabled = true;
  securityViolations: string[] = [];

  // Activation modal
  showActivationModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private subjectService: SubjectService,
    private activationService: ActivationCodeService,
    // ✅ NEW: Inject security services
    private pageSecurity: PageSecurityService,
    private videoIdExtractor: VideoIdExtractorService
  ) {}

  ngOnInit(): void {
    const userRole = this.authService.getUserRole() || '';
    this.isAdminOrSupport = ['admin', 'support'].includes(userRole);
    this.isAdminMode = userRole === 'admin';

    // ✅ NEW: Enable page security for non-admin users
    if (!this.isAdminMode) {
      this.enablePageSecurity();
    }

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async params => {
      this.lessonId = params['id'];
      if (this.lessonId) {
        await this.loadLessonAndAccess();
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.fromCourse = params['course'] || '';
    });
  }

  ngOnDestroy(): void {
    // ✅ NEW: Disable security when leaving page
    this.disablePageSecurity();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ NEW: Security management methods
  private enablePageSecurity(): void {
    console.log('🔒 Enabling page security for lesson content');
    this.securityEnabled = true;
    this.pageSecurity.enableSecurity();

    // Subscribe to security events
    this.pageSecurity.getSecurityEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        const newViolations = events
          .filter(event => !this.securityViolations.includes(event.type))
          .map(event => event.type);
        
        if (newViolations.length > 0) {
          this.securityViolations.push(...newViolations);
          this.onSecurityViolation(newViolations.join(', '));
        }
      });
  }

  private disablePageSecurity(): void {
    if (this.securityEnabled) {
      console.log('🔓 Disabling page security');
      this.pageSecurity.disableSecurity();
      this.securityEnabled = false;
    }
  }

  // ✅ NEW: Handle security violations
  onSecurityViolation(violation: string): void {
    console.warn('🚨 Security violation detected:', violation);
    
    // Show warning message
    this.successMessage = '⚠️ تم اكتشاف محاولة نسخ أو مشاركة المحتوى. يرجى احترام حقوق الطبع والنشر.';
    setTimeout(() => this.successMessage = '', 5000);

    // Optional: You can add more actions here
    // - Log to analytics
    // - Notify server
    // - Pause video
    // - Show blocking modal
  }

  // ✅ NEW: Video player event handlers
  onVideoPlayerEvent(event: VideoPlayerEvent): void {
    console.log('🎬 Video player event:', event);
    
    switch (event.type) {
      case 'play':
        this.isVideoPlaying = true;
        this.isVideoLoading = false;
        break;
      case 'pause':
        this.isVideoPlaying = false;
        break;
      case 'ended':
        this.isVideoPlaying = false;
        // Auto-advance to next video if available
        if (this.currentVideoIndex < this.videoUrls.length - 1) {
          this.nextVideo();
        }
        break;
      case 'loaded':
        this.isVideoLoading = false;
        break;
      case 'error':
        this.isVideoLoading = false;
        this.errorMessage = 'حدث خطأ أثناء تحميل الفيديو';
        break;
    }
  }

  private async loadLessonAndAccess(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response: any = await firstValueFrom(this.lessonService.getLessonById(this.lessonId));
      const lessonData = response.lesson || response;

      this.lesson = {
        id: lessonData?.id,
        title: lessonData?.title || 'درس بدون عنوان',
        description: lessonData?.description || '',
        unitId: lessonData?.unitId,
        order: lessonData?.order ?? 0,
        status: lessonData?.status || 'published',
        isActive: lessonData?.isActive ?? true,
        createdAt: lessonData?.createdAt,
        updatedAt: lessonData?.updatedAt,
        duration: lessonData?.duration ?? 0,
        difficulty: lessonData?.difficulty || 'beginner',
        lessonType: lessonData?.lessonType || 'video',
        isFree: lessonData?.isFree ?? false,
        content: lessonData?.content ?? null,
        thumbnail: lessonData?.thumbnail ?? null,
        price: lessonData?.price ?? 0,
        currency: lessonData?.currency ?? 'جنيه',
        videoUrl: lessonData?.videoUrl ?? null,
        document: lessonData?.document ?? null,
        pdfUrl: lessonData?.pdfUrl ?? null,
        pdfFileName: lessonData?.pdfFileName ?? null,
        pdfFileSize: lessonData?.pdfFileSize ?? null,
        zoomUrl: lessonData?.zoomUrl ?? null,
        zoomMeetingId: lessonData?.zoomMeetingId ?? null,
        zoomPasscode: lessonData?.zoomPasscode ?? null,
        scheduledAt: lessonData?.scheduledAt ?? null,
        academicYearId: lessonData?.academicYearId ?? null,
        studentYearId: lessonData?.studentYearId ?? null,
        hasAccess: lessonData?.hasAccess ?? false,
        requiresPayment: lessonData?.requiresPayment ?? false,
        accessReason: lessonData?.accessReason ?? null
      };

      // ✅ UPDATED: Process video URLs for secure player
      this.processVideoUrls();

      // Process document URLs
      this.processDocumentUrls();

      console.log('📄 Lesson loaded:', {
        id: this.lesson.id,
        title: this.lesson.title,
        lessonType: this.lesson.lessonType,
        videoUrl: this.lesson.videoUrl,
        docUrls: this.docUrls.length,
        hasVideo: this.videoUrls.length > 0
      });

      await this.loadCourseInfo();
      await this.checkLessonAccess();

      this.isLoading = false;

      if (this.isAdminMode) {
        this.successMessage = 'أنت تعرض هذا الدرس في وضع المعاينة كمدير';
        setTimeout(() => (this.successMessage = ''), 5000);
      }
    } catch (err) {
      console.error('Lesson load error', err);
      this.errorMessage = 'حدث خطأ أثناء تحميل بيانات الدرس. يرجى المحاولة مرة أخرى.';
      this.isLoading = false;
    }
  }

  // ✅ NEW: Process video URLs for secure player
  private processVideoUrls(): void {
    this.videoUrls = [];
    
    if (this.lesson?.videoUrl) {
      // Check if it's a YouTube URL and validate it
      const videoResult = this.videoIdExtractor.extractVideoId(this.lesson.videoUrl);
      
      if (videoResult.isValid && videoResult.platform === 'youtube') {
        console.log('✅ Valid YouTube video detected:', {
          originalUrl: this.lesson.videoUrl,
          videoId: videoResult.videoId,
          platform: videoResult.platform
        });
        this.videoUrls = [this.lesson.videoUrl];
      } else if (this.lesson.videoUrl.startsWith('http')) {
        // Keep non-YouTube URLs as-is (for backward compatibility)
        console.log('📹 Non-YouTube video URL:', this.lesson.videoUrl);
        this.videoUrls = [this.lesson.videoUrl];
      }
    }

    console.log('🎬 Processed video URLs:', this.videoUrls);
  }

  // ✅ UPDATED: Process document URLs
  private processDocumentUrls(): void {
    this.docUrls = [];
    
    if (this.lesson?.pdfUrl) {
      this.docUrls.push(this.getFullUrl(this.lesson.pdfUrl));
    } else if (this.lesson?.document) {
      this.docUrls.push(this.getFullUrl(this.lesson.document));
    }
  }

  private getFullUrl(relativeUrl: string): string {
    if (!relativeUrl.startsWith('http')) {
      return `${environment.uploadsBaseUrl}${relativeUrl}`;
    }
    return relativeUrl;
  }

  // ✅ UPDATED: Check if YouTube video
  get hasYouTubeVideo(): boolean {
    if (this.videoUrls.length === 0) return false;
    
    const firstVideoUrl = this.videoUrls[0];
    return this.videoIdExtractor.isYouTubeUrl(firstVideoUrl);
  }

  // ✅ UPDATED: Get current video URL for secure player
  get currentVideoUrl(): string {
    return this.videoUrls[this.currentVideoIndex] || '';
  }

  get hasAnyContent(): boolean {
    const hasVideo = this.videoUrls.length > 0;
    const hasDoc = this.docUrls.length > 0;
    const hasText = !!this.lesson?.content;
    const hasZoom = !!this.lesson?.zoomUrl;
    
    return hasVideo || hasDoc || hasText || hasZoom;
  }

  private async loadCourseInfo(): Promise<void> {
    try {
      if (this.fromCourse) {
        const subject = await firstValueFrom(this.subjectService.getSubject(this.fromCourse));
        this.courseInfo = (subject && (subject as any).subject) ? (subject as any).subject : subject;
      }
    } catch (error) {
      console.warn('Could not load course info:', error);
    }
  }

  private async checkLessonAccess(): Promise<void> {
    if (this.isAdminOrSupport) {
      this.hasAccess = true;
      this.requiresPayment = false;
      return;
    }

    if (this.lesson?.isFree) {
      this.hasAccess = true;
      this.requiresPayment = false;
      return;
    }

    try {
      const access = await firstValueFrom(this.paymentService.checkLessonAccess(this.lessonId));
      this.hasAccess = !!access?.hasAccess;
      this.requiresPayment = !!access?.requiresPayment && !this.hasAccess;
    } catch {
      this.hasAccess = false;
      this.requiresPayment = !this.lesson?.isFree;
    }
  }

  // Video control methods (for backward compatibility)
  onVideoLoaded(): void {
    this.isVideoLoading = false;
  }

  onVideoPlay(): void {
    this.isVideoPlaying = true;
    this.isVideoLoading = false;
  }

  onVideoPause(): void {
    this.isVideoPlaying = false;
  }

  onVideoEnded(): void {
    this.isVideoPlaying = false;
    if (this.currentVideoIndex < this.videoUrls.length - 1) {
      this.nextVideo();
    }
  }

  nextVideo(): void {
    if (this.currentVideoIndex < this.videoUrls.length - 1) {
      this.isVideoLoading = true;
      this.currentVideoIndex++;
    }
  }

  previousVideo(): void {
    if (this.currentVideoIndex > 0) {
      this.isVideoLoading = true;
      this.currentVideoIndex--;
    }
  }

  // ✅ NEW: Toggle security for admin testing
  toggleSecurity(): void {
    if (this.securityEnabled) {
      this.disablePageSecurity();
    } else {
      this.enablePageSecurity();
    }
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.successMessage = 'تم نسخ النص إلى الحافظة';
      setTimeout(() => this.successMessage = '', 2000);
    });
  }

  // Activation modal methods
  openActivationModal(): void {
    this.showActivationModal = true;
  }

  closeActivationModal(): void {
    this.showActivationModal = false;
  }

  onActivationSuccess(response: CodeActivateResponse): void {
    this.successMessage = 'تم تفعيل الدرس بنجاح!';
    this.closeActivationModal();
    this.checkLessonAccess();
  }

  onActivationError(error: string): void {
    this.errorMessage = error;    
  }

  // Navigation methods
  navigateToPayment(planType: 'lesson' | 'subject'): void {
    const queryParams: any = { planType };
    if (planType === 'lesson') {
      queryParams.lessonId = this.lessonId;
      if (this.lesson?.lessonType) {
        queryParams.lessonType = this.lesson.lessonType;
      }
    } else if (planType === 'subject') {
      if (this.fromCourse) queryParams.subjectId = this.fromCourse;
    }
    this.router.navigate(['/student-dashboard/my-payments'], { queryParams });
  }

  backToCourse(): void {
    if (this.fromCourse) {
      this.router.navigate(['/student-dashboard/course-details', this.fromCourse]);
      return;
    }
    if (this.courseInfo?.id) {
      this.router.navigate(['/student-dashboard/course-details', this.courseInfo.id]);
      return;
    }
    this.router.navigate(['/student-dashboard/courses']);
  }

  editLesson(): void {
    if (this.lesson?.unitId && this.fromCourse) {
      this.router.navigate(['/admin-dashboard/courses/edit', this.fromCourse], {
        queryParams: { tab: 'units', unitId: this.lesson.unitId, lessonId: this.lessonId }
      });
    }
  }

  generateActivationCode(): void {
    this.router.navigate(['/admin/activation-codes'], {
      queryParams: { 
        lessonId: this.lessonId,
        lessonTitle: this.lesson?.title 
      }
    });
  }

  formatDuration(seconds?: number): string {
    if (!seconds || seconds === 0) return 'غير محدد';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
    return `${minutes} دقيقة`;
  }

  getDifficultyLabel(difficulty?: string): string {
    switch (difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return 'غير محدد';
    }
  }

  getLessonTypeLabel(lessonType?: string): string {
    switch (lessonType) {
      case 'video': return 'فيديو';
      case 'text': return 'نصي';
      case 'quiz': return 'اختبار';
      case 'assignment': return 'تكليف';
      case 'live': return 'مباشر';
      case 'document': return 'مستند';
      case 'pdf': return 'PDF';
      default: return 'غير محدد';
    }
  }

  retryLoading(): void {
    this.loadLessonAndAccess();
  }
}