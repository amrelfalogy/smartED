import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { 
  Subject as CourseSubject, 
  Unit, 
  Lesson, 
  LessonTypeCard, 
  PaymentPlan, 
  PlanType,
  LessonAccess 
} from 'src/app/core/models/course-complete.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { UnitService } from 'src/app/core/services/unit.service';
import { LessonService } from 'src/app/core/services/lesson.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AuthService } from 'src/app/core/services/auth.service';

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
  errorMessage = '';
  successMessage = '';

  // Admin/support roles bypass access checks
  isAdminMode = false;

  // Lesson Type Selection
  lessonTypeCards: LessonTypeCard[] = [
    {
      id: 'center_recorded',
      title: 'الدروس المسجلة - المركز',
      description: 'دروس مسجلة في المركز التعليمي بجودة عالية',
      icon: 'pi pi-video',
      lessonType: 'center_recorded',
      isAvailable: true,
      isSelected: false,
      color: 'primary'
    },
    {
      id: 'studio_produced',
      title: 'الدروس المنتجة - الاستوديو',
      description: 'دروس منتجة في الاستوديو بجودة احترافية',
      icon: 'pi pi-play-circle',
      lessonType: 'studio_produced',
      isAvailable: true,
      isSelected: false,
      color: 'success'
    },
    {
      id: 'zoom',
      title: 'الجلسات المباشرة - Zoom',
      description: 'جلسات تفاعلية مباشرة عبر Zoom (قريباً)',
      icon: 'pi pi-users',
      lessonType: 'zoom',
      isAvailable: false,
      isSelected: false,
      color: 'secondary'
    }
  ];

  selectedLessonType: 'center_recorded' | 'studio_produced' | 'zoom' | null = null;
  paymentPlans: PaymentPlan[] = [];
  showPaymentModal = false;
  loadingPaymentPlans = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subjectService: SubjectService,
    private unitService: UnitService,
    private lessonService: LessonService,
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Detect admin/support
    const role = this.authService.getUserRole();
    this.isAdminMode = role === 'admin' || role === 'support';

    this.route.params.subscribe(params => {
      this.courseId = params['id'];
      if (this.courseId) {
        this.loadCourseDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load course details + units + lessons
  loadCourseDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subjectService.getSubject(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.subject) {
            this.course = {
              ...response.subject,
              imageUrl: response.subject.imageUrl || response.subject.image || 'assets/imgs/course-placeholder.jpg',
              instructorName: response.subject.instructorName || 'غير محدد',
              difficulty: response.subject.difficulty || 'beginner',
              duration: response.subject.duration || 'غير محدد'
            };

            this.units = response.units || [];

            if (this.units.length > 0) {
              this.loadUnitsLessons();
            } else {
              this.isLoading = false;
              // No units/lessons, keep defaults
            }
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

  

  // Load lessons for each unit
  // ✅ UPDATE: course-details.component.ts - Add debugging to lesson loading
  private loadUnitsLessons(): void {
    this.isLoadingUnits = true;

    const unitIds = this.units.map(u => u.id).filter(Boolean) as string[];
    if (unitIds.length === 0) {
      this.isLoading = false;
      this.isLoadingUnits = false;
      return;
    }

    const requests = unitIds.map(id => this.lessonService.getLessonsByUnit(id));
    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: allLessons => {
          this.units.forEach((unit, idx) => {
            unit.lessons = allLessons[idx] || [];
            console.log(`Unit ${unit.name} lessons:`, unit.lessons.map(l => ({ title: l.title, type: l.lessonType })));
          });

          // Flatten
          this.lessons = this.units.reduce((acc: Lesson[], u) => acc.concat(u.lessons || []), []);
          
          // ✅ Log all lessons with their types
          console.log('All lessons loaded:', this.lessons.map(l => ({ 
            title: l.title, 
            lessonType: l.lessonType,
            unitId: l.unitId 
          })));

          // ✅ Log available lesson types
          const availableTypes = [...new Set(this.lessons.map(l => l.lessonType).filter(Boolean))];
          console.log('Available lesson types:', availableTypes);

          // Auto-select the first available lesson type that has lessons
          this.autoSelectFirstAvailableType();

          this.isLoading = false;
          this.isLoadingUnits = false;
        },
        error: (error) => {
          console.error('Error loading lessons:', error);
          this.errorMessage = 'حدث خطأ أثناء تحميل دروس الكورس';
          this.isLoading = false;
          this.isLoadingUnits = false;
        }
      });
  }

  private autoSelectFirstAvailableType(): void {
    if (this.isAdminMode) {
      // Admin can see all; default to first card having lessons if no selection
    }

    if (this.selectedLessonType) {
      // Already selected via navigation or user click
      this.syncTypeCards();
      if (!this.isAdminMode) this.checkLessonsAccess(); // Preload access
      return;
    }

    const typesInData = new Set(this.lessons.map(l => l.lessonType).filter(Boolean) as string[]);
    const firstAvailable = (['center_recorded', 'studio_produced', 'zoom'] as const).find(t => typesInData.has(t));
    if (firstAvailable) {
      this.selectedLessonType = firstAvailable;
      this.syncTypeCards();
      if (!this.isAdminMode) this.checkLessonsAccess();
    }
  }

  // Selection
  selectLessonType(lessonType: 'center_recorded' | 'studio_produced' | 'zoom'): void {
    if (!this.isLessonTypeAvailable(lessonType)) return;
    this.selectedLessonType = lessonType;
    this.syncTypeCards();
    if (!this.isAdminMode) {
      this.checkLessonsAccess();
    }
  }

  private syncTypeCards(): void {
    this.lessonTypeCards.forEach(c => (c.isSelected = c.lessonType === this.selectedLessonType));
  }

  isLessonTypeAvailable(lessonType: string): boolean {
    // ✅ Zoom is always disabled (as per requirement)
    if (lessonType === 'zoom') return false;
    
    const card = this.lessonTypeCards.find(c => c.lessonType === lessonType);
    if (!card) return false;
    
    // ✅ Check if there are lessons of this type
    const hasLessonsOfType = this.lessons.some(lesson => {
      console.log(`Checking lesson: ${lesson.title}, type: ${lesson.lessonType}, target: ${lessonType}`);
      return lesson.lessonType === lessonType;
    });
    
    console.log(`Lesson type ${lessonType} available:`, hasLessonsOfType);
    return hasLessonsOfType;
  }

  // ✅ UPDATE: course-details.component.ts - Better filtering
  getFilteredLessons(): Lesson[] {
    if (!this.selectedLessonType) return [];
    
    const filtered = this.lessons.filter(lesson => {
      const matches = lesson.lessonType === this.selectedLessonType;
      console.log(`Lesson ${lesson.title}: type=${lesson.lessonType}, selected=${this.selectedLessonType}, matches=${matches}`);
      return matches;
    });
    
    console.log(`Filtered lessons for ${this.selectedLessonType}:`, filtered.length);
    return filtered;
  }

  getFilteredUnits(): Unit[] {
    if (!this.selectedLessonType) return [];
    
    const filteredUnits = this.units
      .map(unit => ({
        ...unit,
        lessons: (unit.lessons || []).filter(lesson => {
          const matches = lesson.lessonType === this.selectedLessonType;
          console.log(`Unit ${unit.name} - Lesson ${lesson.title}: type=${lesson.lessonType}, matches=${matches}`);
          return matches;
        })
      }))
      .filter(unit => (unit.lessons?.length || 0) > 0);
      
    console.log(`Filtered units for ${this.selectedLessonType}:`, filteredUnits.length);
    return filteredUnits;
  }

  // Access checks for students (per-lesson)
  private checkLessonsAccess(): void {
    if (this.isAdminMode) return;

    const filtered = this.getFilteredLessons();
    if (filtered.length === 0) {
      this.enrollmentStatus = 'not_enrolled';
      return;
    }

    this.isCheckingAccess = true;

    const calls = filtered.map(lesson => {
      if (lesson.isFree) {
        // Free lesson: mark immediately
        lesson.hasAccess = true;
        lesson.requiresPayment = false;
        return of({ hasAccess: true, requiresPayment: false } as LessonAccess);
      } else if (lesson.id) {
        return this.paymentService.checkLessonAccess(lesson.id);
      }
      return of({ hasAccess: false, requiresPayment: true } as LessonAccess);
    });

    forkJoin(calls)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          // Map back to lessons
          filtered.forEach((lesson, idx) => {
            const r = results[idx];
            lesson.hasAccess = !!r?.hasAccess;
            lesson.requiresPayment = !!r?.requiresPayment && !lesson.hasAccess;
          });

          this.updateEnrollmentStatusFromLessons(filtered);
          this.isCheckingAccess = false;
        },
        error: (err) => {
          console.error('Error checking lessons access:', err);
          // On error, consider locked; student can still see payment CTA
          filtered.forEach(l => {
            if (!l.isFree) {
              l.hasAccess = false;
              l.requiresPayment = true;
            }
          });
          this.updateEnrollmentStatusFromLessons(filtered);
          this.isCheckingAccess = false;
        }
      });
  }

  private updateEnrollmentStatusFromLessons(lessons: Lesson[]): void {
    // Heuristic:
    // - If any non-free lesson has access → enrolled
    // - Else if any requiresPayment → not_enrolled
    // - Else pending remains default 'not_enrolled' unless your backend exposes a real 'pending' flag
    const anyPaidAccessible = lessons.some(l => !l.isFree && l.hasAccess);
    const anyRequiresPayment = lessons.some(l => !l.isFree && l.requiresPayment);

    if (anyPaidAccessible) {
      this.enrollmentStatus = 'enrolled';
    } else if (anyRequiresPayment) {
      this.enrollmentStatus = 'not_enrolled';
    } else {
      // All free or unknown; treat as enrolled if there are free lessons
      const anyFree = lessons.some(l => l.isFree);
      this.enrollmentStatus = anyFree ? 'enrolled' : 'not_enrolled';
    }
  }

  // Start/open lesson
  // ✅ ADD: Enhanced navigation with debugging
private navigateToLesson(lesson: Lesson, isAdminPreview: boolean = false): void {
  const queryParams: any = {
    course: this.courseId,
    unitId: lesson.unitId
  };

  if (isAdminPreview) {
    queryParams.adminPreview = 'true';
  }

  // Determine the correct route
  let navigationPath: string[];
  
  if (this.isAdminMode && this.router.url.includes('/admin/')) {
    navigationPath = ['/admin/lesson-details', lesson.id ?? ''];
  } else {
    navigationPath = ['/student-dashboard/lesson-details', lesson.id?? ''];
  }

  console.log('🚀 Navigation details:', {
    path: navigationPath,
    queryParams,
    currentUrl: this.router.url,
    isAdmin: this.isAdminMode
  });

  // Navigate with promise handling
  this.router.navigate(navigationPath, { queryParams })
    .then(success => {
      if (success) {
        console.log('✅ Navigation successful');
      } else {
        console.error('❌ Navigation failed - route not found');
        this.errorMessage = 'فشل في فتح الدرس. يرجى التحقق من صحة الرابط.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    })
    .catch(error => {
      console.error('❌ Navigation error:', error);
      this.errorMessage = 'حدث خطأ أثناء فتح الدرس.';
      setTimeout(() => this.errorMessage = '', 3000);
    });
}

// ✅ UPDATE: Simplified startLesson method
startLesson(lesson: Lesson): void {
  if (!lesson?.id) {
    this.errorMessage = 'معرف الدرس غير صحيح';
    setTimeout(() => (this.errorMessage = ''), 2500);
    return;
  }

  if (!this.selectedLessonType) {
    this.errorMessage = 'يرجى اختيار نوع الدروس أولاً';
    setTimeout(() => (this.errorMessage = ''), 2500);
    return;
  }

  console.log('🎯 Starting lesson:', lesson.title);

  // Admin can always access
  if (this.isAdminMode) {
    this.navigateToLesson(lesson, true);
    return;
  }

  // Student access logic
  if (lesson.isFree || lesson.hasAccess) {
    this.navigateToLesson(lesson, false);
    return;
  }

  if (lesson.requiresPayment) {
    this.navigateToLessonPayment(lesson);
    return;
  }

  // Check access dynamically
  this.checkLessonAccessAndNavigate(lesson);
}

  // ✅ NEW: Dynamic access check for uncertain cases
  private checkLessonAccessAndNavigate(lesson: Lesson): void {
    if (!lesson.id) return;

    this.isCheckingAccess = true;
    
    this.paymentService.checkLessonAccess(lesson.id).subscribe({
      next: (access) => {
        this.isCheckingAccess = false;
        
        if (access?.hasAccess) {
          // Has access - navigate to lesson
          lesson.hasAccess = true;
          lesson.requiresPayment = false;
          
          this.router.navigate(['/student-dashboard/lesson-details', lesson.id], {
            queryParams: { 
              course: this.courseId,
              unitId: lesson.unitId
            }
          });
        } else {
          // No access - navigate to payment
          lesson.hasAccess = false;
          lesson.requiresPayment = true;
          this.navigateToLessonPayment(lesson);
        }
      },
      error: (error) => {
        console.error('Access check failed:', error);
        this.isCheckingAccess = false;
        
        // On error, assume payment required
        lesson.hasAccess = false;
        lesson.requiresPayment = true;
        this.navigateToLessonPayment(lesson);
      }
    });
  }

  // Action button on lesson item
  onLessonAction(lesson: Lesson, event: Event): void {
    event.stopPropagation();
    this.startLesson(lesson);
  }

  // Payment routing helpers
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

  navigateToPlan(planType: PlanType): void {
    if (!this.course?.id) return;
    if (!this.selectedLessonType) {
      this.errorMessage = 'يرجى اختيار نوع الدروس أولاً';
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }
    this.router.navigate(
      ['/student-dashboard/my-payments'],
      {
        queryParams: {
          planType,
          subjectId: this.course.id,
          lessonType: this.selectedLessonType
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
    // ✅ Determine current route context
    const currentUrl = this.router.url;
    
    if (this.isAdminMode) {
      // Admin accessed course details
      if (currentUrl.includes('/admin/')) {
        this.router.navigate(['/admin/courses']);
      } else {
        // Admin accessed via student route
        this.router.navigate(['/admin/courses']);
      }
    } else {
      // Student navigation
      if (currentUrl.includes('/student-dashboard/')) {
        // Check if came from course catalog or my courses
        const referrer = document.referrer;
        if (referrer.includes('/courses') && !referrer.includes('/my-courses')) {
          this.router.navigate(['/student-dashboard/courses']);
        } else {
          this.router.navigate(['/student-dashboard/my-courses']);
        }
      } else {
        // Public course browsing
        this.router.navigate(['/courses']);
      }
    }
  }

  // Labels and stats
  getSelectedLessonTypeInfo(): LessonTypeCard | null {
    return this.lessonTypeCards.find(card => card.isSelected) || null;
  }

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

  getTotalLessons(): number {
    return this.getFilteredLessons().length;
  }

  getTotalDuration(): string {
    const totalSeconds = this.getFilteredLessons().reduce((total, lesson) => total + (lesson.duration || 0), 0);
    return this.formatDuration(totalSeconds);
  }

  // Template helpers
  get canEnroll(): boolean {
    return !this.isAdminMode && this.enrollmentStatus === 'not_enrolled';
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