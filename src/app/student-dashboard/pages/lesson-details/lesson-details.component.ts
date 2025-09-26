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

  // Content data
  videoUrls: string[] = [];
  docUrls: string[] = [];

  // UI state
  activeTab: 'video' | 'document' | 'quiz' = 'video';
  isVideoLoading = false;
  currentVideoIndex = 0;
  isVideoPlaying = false;

  // ✅ NEW: Activation modal
  showActivationModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private subjectService: SubjectService,
    private activationService: ActivationCodeService
  ) {}

  ngOnInit(): void {
    const userRole = this.authService.getUserRole() || '';
    this.isAdminOrSupport = ['admin', 'support'].includes(userRole);
    this.isAdminMode = userRole === 'admin';

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
    this.destroy$.next();
    this.destroy$.complete();
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

      // Set content URLs
      this.videoUrls = this.lesson.videoUrl ? [this.lesson.videoUrl] : [];
      // this.docUrls = this.lesson.document ? [this.lesson.document] : [];

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

  // ✅ NEW: Video event handlers
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

  // ✅ NEW: Utility methods
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

  // ✅ NEW: Activation modal methods
  openActivationModal(): void {
    this.showActivationModal = true;
  }

  closeActivationModal(): void {
    this.showActivationModal = false;
  }

  onActivationSuccess(response: CodeActivateResponse): void {
    this.successMessage = 'تم تفعيل الدرس بنجاح!';
    this.closeActivationModal();
    // Reload lesson access
    this.checkLessonAccess();
  }

  onActivationError(error: string): void {
    this.errorMessage = error;
    setTimeout(() => this.errorMessage = '', 5000);
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

  // ✅ NEW: Generate activation code (admin only)
  generateActivationCode(): void {
    this.router.navigate(['/admin/activation-codes'], {
      queryParams: { 
        lessonId: this.lessonId,
        lessonTitle: this.lesson?.title 
      }
    });
  }

  // Utility methods
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

  get hasAnyContent(): boolean {
    return this.videoUrls.length > 0 || 
           this.docUrls.length > 0 || 
           !!this.lesson?.content ||
           !!this.lesson?.zoomUrl;
  }

  retryLoading(): void {
    this.loadLessonAndAccess();
  }
}