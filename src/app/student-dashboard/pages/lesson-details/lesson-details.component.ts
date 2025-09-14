import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject as RxSubject, takeUntil, firstValueFrom } from 'rxjs'; // ✅ Rename RxJS Subject
import { Lesson, Subject as CourseSubject } from 'src/app/core/models/course-complete.model'; // ✅ Rename model Subject
import { LessonService } from 'src/app/core/services/lesson.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SubjectService } from 'src/app/core/services/subject.service';


@Component({
  selector: 'app-lesson-details',
  templateUrl: './lesson-details.component.html',
  styleUrls: ['./lesson-details.component.scss']
})
export class LessonDetailsComponent implements OnInit, OnDestroy {
    private destroy$ = new RxSubject<void>();

  // Route params
  lessonId = '';
  fromCourse = ''; // Course ID to navigate back
  
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

  // Access flags (for students)
  hasAccess = false;
  requiresPayment = false;

  // Content data
  videoUrls: string[] = [];
  docUrls: string[] = [];
  quizzes: any[] = [];

  // UI state
  activeTab: 'video' | 'document' | 'quiz' = 'video';
  isVideoLoading = false;
  isDocLoading = false;

  // Video player state
  currentVideoIndex = 0;
  isVideoPlaying = false;
  videoProgress = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private subjectService: SubjectService
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

    // Get course ID from query params for navigation
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.fromCourse = params['course'] || '';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ ENHANCED: Better error handling and course info loading
  private async loadLessonAndAccess(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // 1) Load lesson details from backend
      const response: any = await firstValueFrom(this.lessonService.getLesson(this.lessonId));
      
      console.log('✅ Raw lesson response:', response);
      
      // Handle both nested and flat response structures
      const lessonData = response.lesson || response;
      const details = {
        lesson: lessonData,
        videos: response.videos || [],
        quizzes: response.quizzes || [],
        documents: response.documents || []
      };

      // Normalize lesson data
      this.lesson = {
        id: lessonData?.id,
        title: lessonData?.title || 'درس بدون عنوان',
        description: lessonData?.description || '',
        unitId: lessonData?.unitId,
        order: lessonData?.order ?? 0,
        status: lessonData?.status || 'draft',
        isActive: lessonData?.isActive ?? true,
        createdAt: lessonData?.createdAt,
        updatedAt: lessonData?.updatedAt,
        // Enhanced fields with better defaults
        duration: lessonData?.duration ?? 0,
        difficulty: lessonData?.difficulty || 'beginner',
        lessonType: lessonData?.lessonType || 'center_recorded',
        sessionType: lessonData?.sessionType || 'recorded',
        isFree: lessonData?.isFree ?? false
      };

      // 2) Extract content arrays
      this.videoUrls = this.extractUrls(details.videos);
      this.docUrls = this.extractUrls(details.documents);
      this.quizzes = Array.isArray(details.quizzes) ? details.quizzes : [];

      // Handle legacy content structure
      if (!this.videoUrls.length && lessonData?.content?.videoUrl) {
        this.videoUrls = [lessonData.content.videoUrl];
      }
      if (!this.docUrls.length && lessonData?.content?.documentUrl) {
        this.docUrls = [lessonData.content.documentUrl];
      }

      console.log('✅ Processed lesson:', this.lesson);
      console.log('✅ Content:', { videos: this.videoUrls.length, docs: this.docUrls.length, quizzes: this.quizzes.length });

      // 3) Load course info for better navigation
      await this.loadCourseInfo();

      // 4) Check access for students
      await this.checkLessonAccess();

      // 5) Set default tab based on available content
      this.setDefaultTab();

      this.isLoading = false;

      // Show admin preview message
      if (this.isAdminMode) {
        this.successMessage = 'أنت تعرض هذا الدرس في وضع المعاينة كمدير';
        setTimeout(() => this.successMessage = '', 3000);
      }

    } catch (err) {
      console.error('Lesson load error', err);
      this.errorMessage = 'حدث خطأ أثناء تحميل بيانات الدرس. يرجى المحاولة مرة أخرى.';
      this.isLoading = false;
    }
  }

  // ✅ NEW: Load course information
  // ✅ FIX: Update the loadCourseInfo method
  private async loadCourseInfo(): Promise<void> {
      try {
        if (this.fromCourse) {
          const courseResponse = await firstValueFrom(this.subjectService.getSubject(this.fromCourse));
          
          // ✅ FIX: Handle the response structure correctly
          this.courseInfo = courseResponse; // This is the CourseSubject object
          
          console.log('✅ Course info loaded:', this.courseInfo);
        } else if (this.lesson?.unitId) {
          // ✅ Alternative: Get subject from unitId
          const subjectId = await this.getSubjectIdFromUnit(this.lesson.unitId);
          if (subjectId) {
            const courseResponse = await firstValueFrom(this.subjectService.getSubject(subjectId));
            this.courseInfo = courseResponse;
          }
        }
      } catch (error) {
        console.warn('Could not load course info:', error);
        // Non-critical error, continue without course info
      }
    }

// ✅ NEW: Helper method to get subjectId from unitId
private async getSubjectIdFromUnit(unitId: string): Promise<string | null> {
  try {
    // Option 2: Search through subjects to find the unit
    // This is less efficient but works with current API structure
    console.warn('Cannot determine subjectId from unitId without additional API endpoint');
    return null;
  } catch (error) {
    console.error('Error getting subjectId from unitId:', error);
    return null;
  }
}

  // ✅ UPDATE: Better access checking with proper endpoint
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
      // ✅ UPDATE: Use the correct endpoint format
      const access = await firstValueFrom(
        this.paymentService.checkLessonAccess(this.lessonId)
      );
      
      console.log('✅ Access check response:', access);
      
      this.hasAccess = !!access?.hasAccess;
      this.requiresPayment = !!access?.requiresPayment && !this.hasAccess;
      
      // ✅ Alternative: If the endpoint returns different format
      // this.hasAccess = access === true || access?.hasAccess === true;
      // this.requiresPayment = !this.hasAccess;
      
    } catch (accessError) {
      console.warn('Access check failed, assuming no access:', accessError);
      
      // ✅ For paid lessons, assume payment required if access check fails
      this.hasAccess = false;
      this.requiresPayment = !this.lesson?.isFree;
    }
  }

  // ✅ ENHANCED: Smarter default tab selection
  private setDefaultTab(): void {
    if (this.videoUrls.length > 0) {
      this.activeTab = 'video';
    } else if (this.docUrls.length > 0) {
      this.activeTab = 'document';
    } else if (this.quizzes.length > 0) {
      this.activeTab = 'quiz';
    } else {
      this.activeTab = 'video'; // Default even if empty
    }
  }

  // ✅ ENHANCED: Better URL extraction
  private extractUrls(items: Array<{ url?: string; title?: string } | string> | undefined): string[] {
    if (!Array.isArray(items)) return [];
    return items
      .map(item => {
        if (typeof item === 'string') return item;
        return item?.url;
      })
      .filter(Boolean) as string[];
  }

  // ✅ NEW: Video player controls
  onVideoPlay(): void {
    this.isVideoPlaying = true;
  }

  onVideoPause(): void {
    this.isVideoPlaying = false;
  }

  onVideoEnded(): void {
    this.isVideoPlaying = false;
    // Auto-advance to next video if available
    if (this.currentVideoIndex < this.videoUrls.length - 1) {
      this.nextVideo();
    }
  }

  nextVideo(): void {
    if (this.currentVideoIndex < this.videoUrls.length - 1) {
      this.currentVideoIndex++;
    }
  }

  previousVideo(): void {
    if (this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
    }
  }

  selectVideo(index: number): void {
    this.currentVideoIndex = index;
  }

  // ✅ ENHANCED: Tab management
  changeTab(tab: 'video' | 'document' | 'quiz'): void {
    // Check if tab has content
    if (tab === 'video' && this.videoUrls.length === 0) return;
    if (tab === 'document' && this.docUrls.length === 0) return;
    if (tab === 'quiz' && this.quizzes.length === 0) return;

    this.activeTab = tab;
  }

  // ✅ ENHANCED: Payment navigation with better context
  navigateToPayment(planType: 'lesson' | 'monthly' | 'semester'): void {
    const queryParams: any = { planType };
    
    if (planType === 'lesson') {
      queryParams.lessonId = this.lessonId;
      if (this.lesson?.lessonType) {
        queryParams.lessonType = this.lesson.lessonType;
      }
    }
    
    if (this.fromCourse) {
      queryParams.subjectId = this.fromCourse;
    }

    this.router.navigate(['/student-dashboard/my-payments'], { queryParams });
  }

  // ✅ ENHANCED: Better navigation
  backToCourse(): void {
    // Priority 1: Use fromCourse query parameter
    if (this.fromCourse) {
      this.router.navigate(['/student-dashboard/course-details', this.fromCourse]);
      return;
    }

    // Priority 2: Use courseInfo if loaded
    if (this.courseInfo?.id) {
      this.router.navigate(['/student-dashboard/course-details', this.courseInfo.id]);
      return;
    }

    // Priority 3: Try to determine course from lesson data
    if (this.lesson?.unitId) {
      // We could try to find the course through the unit
      this.navigateViaCourseSearch();
      return;
    }

    // Priority 4: Fallback to courses list
    this.router.navigate(['/student-dashboard/courses']);
  }

  // ✅ NEW: Navigate via course search (fallback)
  private navigateViaCourseSearch(): void {
    // This would require searching for the course that contains this unit
    // For now, just go to courses list
    console.log('Cannot determine course, navigating to courses list');
    this.router.navigate(['/student-dashboard/courses']);
  }

  // ✅ NEW: Admin actions
  editLesson(): void {
    if (this.lesson?.unitId && this.fromCourse) {
      this.router.navigate(['/admin-dashboard/courses/edit', this.fromCourse], {
        queryParams: { tab: 'units', unitId: this.lesson.unitId, lessonId: this.lessonId }
      });
    }
  }

  // ✅ ENHANCED: Better helpers
  isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url) || 
           url.includes('youtube.com') || 
           url.includes('vimeo.com') ||
           url.includes('cloudinary.com');
  }

  isDocumentUrl(url: string): boolean {
    return /\.(pdf|doc|docx|ppt|pptx)(\?.*)?$/i.test(url);
  }

  formatDuration(seconds?: number): string {
    if (!seconds || seconds === 0) return 'غير محدد';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة`;
    }
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
      case 'center_recorded': return 'مسجل - المركز';
      case 'studio_produced': return 'منتج - الاستوديو';
      case 'zoom': return 'مباشر - Zoom';
      default: return 'غير محدد';
    }
  }

  // ✅ NEW: Content availability checks
  get hasAnyContent(): boolean {
    return this.videoUrls.length > 0 || this.docUrls.length > 0 || this.quizzes.length > 0;
  }

  get availableTabsCount(): number {
    let count = 0;
    if (this.videoUrls.length > 0) count++;
    if (this.docUrls.length > 0) count++;
    if (this.quizzes.length > 0) count++;
    return count;
  }

  // ✅ NEW: Error recovery
  retryLoading(): void {
    this.loadLessonAndAccess();
  }

  // ✅ NEW: Report issue (for students)
  reportIssue(): void {
    // Could open a modal or navigate to support
    console.log('Report issue for lesson:', this.lessonId);
  }
}