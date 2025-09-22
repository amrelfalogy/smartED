import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';
import { 
  Subject as CourseSubject, 
  Unit, 
  Lesson
} from 'src/app/core/models/course-complete.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { UnitService } from 'src/app/core/services/unit.service';
import { LessonService } from 'src/app/core/services/lesson.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { ActivationCodeService } from 'src/app/core/services/activation-code.service';

type EnrollmentStatus = 'enrolled' | 'not_enrolled' | 'pending';

@Component({
  selector: 'app-course-details',
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss']
})
export class CourseDetailsComponent implements OnInit, OnDestroy {
  courseId: string = '';
  course: CourseSubject | null = null;
  units: Unit[] = [];
  lessons: Lesson[] = [];

  isLoading = false;
  isLoadingUnits = false;
  isCheckingAccess = false;

  enrollmentStatus: EnrollmentStatus = 'not_enrolled';
  isSubjectEnrolled = false; 
  hasIndividualLessonAccess = false; 

  errorMessage = '';
  successMessage = '';

  isAdminMode = false;

  // For UI highlighting of subject-level sessionType
  selectedLessonType: 'center_recorded' | 'studio_produced' | 'zoom' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subjectService: SubjectService,
    private unitService: UnitService,
    private lessonService: LessonService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private activationCodeService: ActivationCodeService
  ) {}

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    this.isAdminMode = role === 'admin' || role === 'support';

    this.route.params.subscribe(params => {
      this.courseId = params['id'];
      if (this.courseId) {
        this.loadCourseDetails();
      }
    });
        this.listenForActivationSuccess();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  
  // ✅ ENHANCED: Better activation success handling in course-details.component.ts
  private listenForActivationSuccess(): void {
    this.activationCodeService.onActivationSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        if (response) {
          console.log('🎯 Activation success detected, response:', JSON.stringify(response, null, 2));
          
          // Show success message
          this.successMessage = 'تم تفعيل الرمز بنجاح! يمكنك الآن الوصول للدرس.';
          
          // ✅ CRITICAL: Get the lesson ID from the response
          const activatedLessonId = response.accessGranted?.lessonId || response.access?.lessonId;
          console.log('🎯 Activated lesson ID:', activatedLessonId);
          
          if (activatedLessonId) {
            // ✅ STEP 1: Immediately mark lesson as accessible
            this.markLessonAsAccessible(activatedLessonId);
            
            // ✅ STEP 2: Refresh lesson access after a short delay
            setTimeout(() => {
              this.refreshSingleLessonAccess(activatedLessonId);
            }, 1000);
            
            // ✅ STEP 3: Full refresh as backup
            setTimeout(() => {
              this.checkLessonsAccess();
            }, 2000);
          }
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            this.successMessage = '';
            this.activationCodeService.clearActivationSuccess();
          }, 5000);
        }
      });
  }

  // ✅ NEW: Immediately mark lesson as accessible
  private markLessonAsAccessible(lessonId: string): void {
    console.log('🔓 Marking lesson as accessible immediately:', lessonId);
    
    // Find and update in units
    this.units.forEach(unit => {
      if (unit.lessons) {
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (lesson) {
          console.log('✅ Found lesson in unit, marking accessible:', lesson.title);
          lesson.hasAccess = true;
          lesson.requiresPayment = false;
        }
      }
    });
    
    // Find and update in global lessons array
    const globalLesson = this.lessons.find(l => l.id === lessonId);
    if (globalLesson) {
      console.log('✅ Found lesson globally, marking accessible:', globalLesson.title);
      globalLesson.hasAccess = true;
      globalLesson.requiresPayment = false;
    }
    
    // Update access indicators
    this.hasIndividualLessonAccess = this.lessons.some(l => !l.isFree && l.hasAccess);
    
    console.log('📊 Updated access state:', {
      hasIndividualLessonAccess: this.hasIndividualLessonAccess,
      isSubjectEnrolled: this.isSubjectEnrolled
    });
  }

  // ✅ NEW: Refresh single lesson access
  private refreshSingleLessonAccess(lessonId: string): void {
    console.log('🔄 Refreshing access for specific lesson:', lessonId);
    
    this.paymentService.checkLessonAccess(lessonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accessResult) => {
          console.log('✅ Single lesson access result:', accessResult);
          
          // Update the specific lesson
          this.units.forEach(unit => {
            if (unit.lessons) {
              const lesson = unit.lessons.find(l => l.id === lessonId);
              if (lesson) {
                lesson.hasAccess = accessResult.hasAccess;
                lesson.requiresPayment = accessResult.requiresPayment;
                console.log('🔄 Updated lesson access:', {
                  lessonTitle: lesson.title,
                  hasAccess: lesson.hasAccess,
                  requiresPayment: lesson.requiresPayment
                });
              }
            }
          });
          
          // Update global lessons array
          const globalLesson = this.lessons.find(l => l.id === lessonId);
          if (globalLesson) {
            globalLesson.hasAccess = accessResult.hasAccess;
            globalLesson.requiresPayment = accessResult.requiresPayment;
          }
          
          // Update indicators
          this.hasIndividualLessonAccess = this.lessons.some(l => !l.isFree && l.hasAccess);
        },
        error: (error) => {
          console.error('❌ Failed to refresh single lesson access:', error);
        }
      });
  }

  // ✅ NEW: Update specific lesson access immediately
  private updateLessonAccess(lessonId: string): void {
    // Find the lesson in all units and mark it as accessible
    this.units.forEach(unit => {
      if (unit.lessons) {
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (lesson) {
          console.log('🔓 Marking lesson as accessible:', lesson.title);
          lesson.hasAccess = true;
          lesson.requiresPayment = false;
          
          // Update the lessons array as well
          const globalLesson = this.lessons.find(l => l.id === lessonId);
          if (globalLesson) {
            globalLesson.hasAccess = true;
            globalLesson.requiresPayment = false;
          }
        }
      }
    });
    
    // Force change detection
    this.checkIndividualLessonAccess();
  }

  // ✅ NEW: Check individual lesson access status
  private checkIndividualLessonAccess(): void {
    // Update hasIndividualLessonAccess based on current lesson states
    this.hasIndividualLessonAccess = this.lessons.some(l => !l.isFree && l.hasAccess);
    
    // Log current access state
    const accessibleLessons = this.lessons.filter(l => l.hasAccess || l.isFree);
    console.log('📊 Current lesson access:', {
      total: this.lessons.length,
      accessible: accessibleLessons.length,
      hasIndividualAccess: this.hasIndividualLessonAccess,
      isSubjectEnrolled: this.isSubjectEnrolled
    });
  }

  loadCourseDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subjectService.getSubject(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subject) => {
          if (subject) {
            const normalized = (subject as any).subject ? (subject as any).subject : subject;
            this.course = {
              ...normalized,
              imageUrl: normalized.imageUrl || (normalized as any).image || 'assets/imgs/aboutt.jpg',
              instructorName: (normalized as any).instructorName || 'غير محدد',
              difficulty: normalized.difficulty || 'beginner',
              duration: normalized.duration || 'غير محدد'
            };

            // Map subject.sessionType to UI selection
            const st = (this.course as any).sessionType as string | undefined;
            this.selectedLessonType =
              st === 'studio' ? 'studio_produced'
              : (st === 'recorded' || st === 'center_recorded') ? 'center_recorded'
              : st === 'live' || st === 'zoom' ? 'zoom'
              : null;

            // Load units and lessons using updated lesson service
            this.unitService.getUnitsBySubject(this.courseId).pipe(takeUntil(this.destroy$)).subscribe({
              next: (units) => {
                this.units = units || [];
                if (this.units.length > 0) {
                  this.loadUnitsLessons();
                } else {
                  this.isLoading = false;
                }
              },
              error: (error) => {
                console.error('Error loading units:', error);
                this.units = [];
                this.isLoading = false;
              }
            });
          } else {
            throw new Error('Invalid response structure');
          }
        },
        error: (error) => {
          console.error('Error loading course details:', error);
          this.errorMessage = 'حدث خطأ أثناء تحميل تفاصيل الكورس';
          this.isLoading = false;
        }
      });
  }

  // ✅ UPDATED: Use improved lesson service with fallback
  private loadUnitsLessons(): void {
    this.isLoadingUnits = true;

    const unitIds = this.units.map(u => u.id).filter(Boolean) as string[];
    if (unitIds.length === 0) {
      this.isLoading = false;
      this.isLoadingUnits = false;
      return;
    }

    console.log('🔄 Loading lessons for units:', unitIds);

    // ✅ Use improved lesson service that handles both API filtering and fallback
    const requests = unitIds.map(id => {
      return this.lessonService.getLessonsByUnit(id).pipe(
        catchError((error) => {
          console.warn(`⚠️ Failed to load lessons for unit ${id}, trying fallback:`, error);
          return this.lessonService.getLessonsByUnitClientSide(id).pipe(
            catchError((fallbackError) => {
              console.error(`❌ Both methods failed for unit ${id}:`, fallbackError);
              return of([]); // Return empty array as final fallback
            })
          );
        })
      );
    });

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: allLessons => {
          console.log('✅ Loaded lessons for all units:', allLessons);
          
          this.units.forEach((unit, idx) => {
            unit.lessons = Array.isArray(allLessons[idx]) ? allLessons[idx] : [];
            console.log(`Unit ${unit.name}: ${unit.lessons.length} lessons`);
          });

          this.lessons = this.units.reduce((acc: Lesson[], u) => acc.concat(u.lessons || []), []);
          console.log(`📚 Total lessons loaded: ${this.lessons.length}`);

          if (!this.isAdminMode && this.lessons.length > 0) {
            this.checkLessonsAccess();
          }

          this.isLoading = false;
          this.isLoadingUnits = false;
        },
        error: (error) => {
          console.error('❌ Error loading lessons:', error);
          this.errorMessage = 'حدث خطأ أثناء تحميل دروس الكورس';
          this.isLoading = false;
          this.isLoadingUnits = false;
        }
      });
  }

 // Update the checkLessonsAccess method to use the fixed checkSubjectAccess
private checkLessonsAccess(): void {
  if (this.isAdminMode) return;

  const filtered = this.lessons;
  if (filtered.length === 0) {
    this.enrollmentStatus = 'not_enrolled';
    this.isSubjectEnrolled = false;
    this.hasIndividualLessonAccess = false;
    return;
  }

  this.isCheckingAccess = true;

  // Check individual lesson access
  const lessonCalls = filtered.map(lesson => {
    if (lesson.isFree) {
      lesson.hasAccess = true;
      lesson.requiresPayment = false;
      return of({ hasAccess: true, requiresPayment: false, accessType: 'free' });
    } else if (lesson.id) {
      return this.paymentService.checkLessonAccess(lesson.id).pipe(
        catchError(error => {
          console.warn(`Access check failed for lesson ${lesson.id}:`, error);
          return of({ hasAccess: false, requiresPayment: true, accessType: 'none' });
        })
      );
    }
    return of({ hasAccess: false, requiresPayment: true, accessType: 'none' });
  });

  // ✅ Use the fixed subject access check
  const subjectAccessCall = this.course?.id ? 
    this.paymentService.checkSubjectAccess(this.course.id).pipe(
      catchError(error => {
        console.warn(`Subject access check failed for ${this.course?.id}:`, error);
        return of({ hasAccess: false, isFullAccess: false, enrollmentStatus: 'not_enrolled' });
      })
    ) : of({ hasAccess: false, isFullAccess: false, enrollmentStatus: 'not_enrolled' });

  forkJoin({
    lessonAccess: forkJoin(lessonCalls),
    subjectAccess: subjectAccessCall
  })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (results) => {
        // Process lesson access results
        filtered.forEach((lesson, idx) => {
          const r: any = results.lessonAccess[idx];
          lesson.hasAccess = !!r?.hasAccess;
          lesson.requiresPayment = !!r?.requiresPayment && !lesson.hasAccess;
        });

        // Process subject access results
        const subjectResult: any = results.subjectAccess;
        this.isSubjectEnrolled = !!subjectResult?.hasAccess || !!subjectResult?.isFullAccess;

        // Check for individual lesson access (non-free lessons with access)
        this.hasIndividualLessonAccess = filtered.some(l => !l.isFree && l.hasAccess);

        // Set enrollment status based on subject enrollment
        this.enrollmentStatus = this.isSubjectEnrolled ? 'enrolled' : 'not_enrolled';

        console.log('📊 Fixed Access Check Results:', {
          isSubjectEnrolled: this.isSubjectEnrolled,
          hasIndividualLessonAccess: this.hasIndividualLessonAccess,
          enrollmentStatus: this.enrollmentStatus,
          canEnroll: this.canEnroll,
          subjectAccessType: subjectResult?.accessType
        });

        this.isCheckingAccess = false;
      },
      error: (error) => {
        console.error('❌ Access check error:', error);
        // Set fallback values that show CTA
        this.isSubjectEnrolled = false;
        this.hasIndividualLessonAccess = this.lessons.some(l => !l.isFree && l.hasAccess);
        this.enrollmentStatus = 'not_enrolled';
        this.isCheckingAccess = false;
      }
    });
}

  // Start/open lesson
  private navigateToLesson(lesson: Lesson, isAdminPreview: boolean = false): void {
    const queryParams: any = {
      course: this.courseId,
      unitId: lesson.unitId
    };

    if (isAdminPreview) {
      queryParams.adminPreview = 'true';
    }

    let navigationPath: string[];
    if (this.isAdminMode && this.router.url.includes('/admin/')) {
      navigationPath = ['/admin/lesson-details', lesson.id ?? ''];
    } else {
      navigationPath = ['/student-dashboard/lesson-details', lesson.id ?? ''];
    }

    this.router.navigate(navigationPath, { queryParams })
      .catch(error => {
        console.error('Navigation error:', error);
        this.errorMessage = 'حدث خطأ أثناء فتح الدرس.';
        setTimeout(() => this.errorMessage = '', 3000);
      });
  }

  startLesson(lesson: Lesson): void {
    if (!lesson?.id) {
      this.errorMessage = 'معرف الدرس غير صحيح';
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }

    if (this.isAdminMode) {
      this.navigateToLesson(lesson, true);
      return;
    }

    if (lesson.isFree || lesson.hasAccess) {
      this.navigateToLesson(lesson, false);
      return;
    }

    if (lesson.requiresPayment) {
      this.navigateToLessonPayment(lesson);
      return;
    }

    this.checkLessonAccessAndNavigate(lesson);
  }

  private checkLessonAccessAndNavigate(lesson: Lesson): void {
    if (!lesson.id) return;

    this.isCheckingAccess = true;
    
    this.paymentService.checkLessonAccess(lesson.id).subscribe({
      next: (access) => {
        this.isCheckingAccess = false;
        
        if (access?.hasAccess) {
          lesson.hasAccess = true;
          lesson.requiresPayment = false;
          
          this.router.navigate(['/student-dashboard/lesson-details', lesson.id], {
            queryParams: { 
              course: this.courseId,
              unitId: lesson.unitId
            }
          });
        } else {
          lesson.hasAccess = false;
          lesson.requiresPayment = true;
          this.navigateToLessonPayment(lesson);
        }
      },
      error: (error) => {
        console.error('Access check failed:', error);
        this.isCheckingAccess = false;
        
        lesson.hasAccess = false;
        lesson.requiresPayment = true;
        this.navigateToLessonPayment(lesson);
      }
    });
  }

  onLessonAction(lesson: Lesson, event: Event): void {
    event.stopPropagation();
    this.startLesson(lesson);
  }

  private navigateToLessonPayment(lesson: Lesson): void {
    if (!lesson.lessonType) {
      this.errorMessage = 'نوع الدرس غير محدد';
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }
    this.router.navigate(
      ['/student-dashboard/my-payments'],
      {
        queryParams: {
          planType: 'lesson',
          lessonId: lesson.id,
          lessonType: lesson.lessonType
        }
      }
    );
  }

  // Navigate to subject-level payment
  navigateToPlanSubject(): void {
    if (!this.course?.id) return;
    this.router.navigate(
      ['/student-dashboard/my-payments'],
      {
        queryParams: {
          planType: 'subject',
          subjectId: this.course.id
        }
      }
    );
  }

  // Admin actions
  editCourse(): void {
    if (this.isAdminMode && this.course?.id) {
      this.router.navigate(['/admin/courses', this.course.id, 'edit']);
    }
  }

  toggleCourseStatus(): void {
    if (!this.isAdminMode || !this.course?.id) return;

    this.isLoading = true;
    const newStatus = this.course.status === 'published' ? 'draft' : 'published';

    this.subjectService.updateSubjectStatus(this.course.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCourse) => {
          this.course = updatedCourse;
          this.successMessage = `تم ${newStatus === 'published' ? 'نشر' : 'إلغاء نشر'} الكورس بنجاح`;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'حدث خطأ أثناء تحديث حالة الكورس';
          this.isLoading = false;
        }
      });
  }

  viewStudents(): void {
    if (this.isAdminMode && this.course?.id) {
      this.router.navigate(['/admin/courses', this.course.id, 'students']);
    }
  }

  // Navigation
  goBack(): void {
    const currentUrl = this.router.url;
    
    if (this.isAdminMode) {
      if (currentUrl.includes('/admin/')) {
        this.router.navigate(['/admin/courses']);
      } else {
        this.router.navigate(['/admin/courses']);
      }
    } else {
      if (currentUrl.includes('/student-dashboard/')) {
        const referrer = document.referrer || '';
        if (referrer.includes('/courses') && !referrer.includes('/my-courses')) {
          this.router.navigate(['/student-dashboard/courses']);
        } else {
          this.router.navigate(['/student-dashboard/my-courses']);
        }
      } else {
        this.router.navigate(['/courses']);
      }
    }
  }

  // Labels and stats
  formatDuration(seconds: number): string {
    const minutes = Math.floor((seconds || 0) / 60);
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} ساعة ${remainingMinutes} دقيقة` : `${hours} ساعة`;
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return 'غير محدد';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
  }

  getTotalDuration(): string {
    const totalSeconds = this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
    return this.formatDuration(totalSeconds);
  }

  // Template helpers
  get canEnroll(): boolean {
    return !this.isAdminMode && !this.isSubjectEnrolled;
  }

  get canEnrollInSubject(): boolean {
    // Alternative method for more explicit naming
    return this.canEnroll;
  }

   get hasPartialAccess(): boolean {
    // Check if user has access to some lessons but not the full subject
    return !this.isSubjectEnrolled && this.hasIndividualLessonAccess;
  }

  get showEnrollmentActions(): boolean {
    return !this.isAdminMode;
  }

  get hasUnits(): boolean {
    return this.units.length > 0;
  }

  get hasLessons(): boolean {
    return this.lessons.length > 0;
  }

  get isLoadingContent(): boolean {
    return this.isLoading || this.isLoadingUnits || this.isCheckingAccess;
  }
}