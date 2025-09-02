import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  Subject as CourseSubject, 
  Unit, 
  Lesson, 
  LessonTypeCard, 
  PaymentPlan, 
  LessonAccess 
} from 'src/app/core/models/course-complete.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { UnitService } from 'src/app/core/services/unit.service';
import { LessonService } from 'src/app/core/services/lesson.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AuthService } from 'src/app/core/services/auth.service';

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
  enrollmentStatus = 'not_enrolled';
  errorMessage = '';
  successMessage = '';

  // ✅ ADD: Admin mode detection
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
    // ✅ ADD: Check if in admin mode
    this.isAdminMode = this.route.snapshot.data['mode'] === 'admin';
    
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

  // ✅ UPDATED: Load course details from API
  loadCourseDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.subjectService.getSubject(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Course details response:', response);
          
          if (response.subject) {
            this.course = {
              ...response.subject,
              imageUrl: response.subject.imageUrl || response.subject.image || 'assets/imgs/course-placeholder.jpg',
              instructorName: response.subject.instructorName || 'غير محدد',
              difficulty: response.subject.difficulty || 'beginner',
              duration: response.subject.duration || 'غير محدد'
            };
            
            // Set units from response
            this.units = response.units || [];
            
            // Load lessons for each unit
            if (this.units.length > 0) {
              this.loadUnitsLessons();
            } else {
              this.isLoading = false;
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

  // ✅ NEW: Load lessons for all units
  private loadUnitsLessons(): void {
    this.isLoadingUnits = true;
    
    if (this.units.length === 0) {
      this.isLoading = false;
      this.isLoadingUnits = false;
      return;
    }

    const unitIds = this.units.map(unit => unit.id).filter(id => id);
    
    if (unitIds.length === 0) {
      this.isLoading = false;
      this.isLoadingUnits = false;
      return;
    }

    // Load lessons for each unit
    const lessonRequests = unitIds.map(unitId => 
      this.lessonService.getLessonsByUnit(unitId!)
    );

    Promise.all(lessonRequests.map(req => req.toPromise()))
      .then(allLessons => {
        // Assign lessons to their respective units
        this.units.forEach((unit, index) => {
          unit.lessons = allLessons[index] || [];
        });
        
        // Flatten all lessons for filtering
        this.lessons = this.units.reduce((acc: Lesson[], unit) => {
          return acc.concat(unit.lessons || []);
        }, []);
        
        console.log('Loaded units with lessons:', this.units);
        console.log('All lessons:', this.lessons);
        
        this.isLoading = false;
        this.isLoadingUnits = false;
      })
      .catch(error => {
        console.error('Error loading lessons:', error);
        this.errorMessage = 'حدث خطأ أثناء تحميل دروس الكورس';
        this.isLoading = false;
        this.isLoadingUnits = false;
      });
  }

  // Select lesson type
  selectLessonType(lessonType: 'center_recorded' | 'studio_produced' | 'zoom'): void {
    if (!this.isLessonTypeAvailable(lessonType)) {
      return;
    }

    this.selectedLessonType = lessonType;
    
    // Update selection state
    this.lessonTypeCards.forEach(card => {
      card.isSelected = card.lessonType === lessonType;
    });

    // Check lesson access for the selected type (only for students)
    if (!this.isAdminMode) {
      this.checkLessonsAccess();
    }
  }

  // Check if lesson type is available
  isLessonTypeAvailable(lessonType: string): boolean {
    const card = this.lessonTypeCards.find(c => c.lessonType === lessonType);
    if (!card?.isAvailable) return false;
    
    // Check if there are lessons of this type
    return this.lessons.some(lesson => lesson.lessonType === lessonType);
  }

  // Get filtered lessons by type
  getFilteredLessons(): Lesson[] {
    if (!this.selectedLessonType) {
      return [];
    }
    return this.lessons.filter(lesson => lesson.lessonType === this.selectedLessonType);
  }

  // Get filtered units with lessons of selected type
  getFilteredUnits(): Unit[] {
    if (!this.selectedLessonType) {
      return [];
    }
    
    return this.units.map(unit => ({
      ...unit,
      lessons: (unit.lessons || []).filter(lesson => lesson.lessonType === this.selectedLessonType)
    })).filter(unit => unit.lessons!.length > 0);
  }

  // Check lessons access (for students only)
  private checkLessonsAccess(): void {
    if (this.isAdminMode) return;
    
    const filteredLessons = this.getFilteredLessons();
    
    filteredLessons.forEach(lesson => {
      if (!lesson.isFree) {
        this.paymentService.checkLessonAccess(lesson.id!).subscribe({
          next: (access: LessonAccess) => {
            lesson.hasAccess = access.hasAccess;
            lesson.requiresPayment = access.requiresPayment;
          },
          error: (error) => {
            console.error('Error checking lesson access:', error);
            lesson.hasAccess = false;
            lesson.requiresPayment = true;
          }
        });
      } else {
        lesson.hasAccess = true;
        lesson.requiresPayment = false;
      }
    });
  }

  // Start lesson with access check
  startLesson(lesson: Lesson): void {
    if (this.isAdminMode) {
      // Admin preview mode
      this.router.navigate(['/admin-dashboard/lesson-preview', lesson.id]);
      return;
    }

    if (lesson.isFree || lesson.hasAccess) {
      this.router.navigate(['/student-dashboard/lesson-details', lesson.id]);
    } else if (lesson.requiresPayment) {
      this.showPaymentOptions(lesson);
    } else {
      this.showAccessDenied();
    }
  }

  // Show payment options
  showPaymentOptions(lesson: Lesson): void {
    this.loadingPaymentPlans = true;
    this.showPaymentModal = true;
    
    this.paymentService.getPaymentPlans(lesson.lessonType).subscribe({
      next: (response) => {
        this.paymentPlans = response.plans.filter(plan => plan.isActive);
        this.loadingPaymentPlans = false;
      },
      error: (error) => {
        console.error('Error loading payment plans:', error);
        this.loadingPaymentPlans = false;
        this.loadGeneralPaymentPlans();
      }
    });
  }

  // Load general payment plans
  private loadGeneralPaymentPlans(): void {
    this.paymentService.getPaymentPlans().subscribe({
      next: (response) => {
        this.paymentPlans = response.plans.filter(plan => plan.isActive);
      },
      error: (error) => {
        console.error('Error loading general payment plans:', error);
        this.paymentPlans = [];
      }
    });
  }

  // Subscribe to plan
  subscribeToPlan(plan: PaymentPlan): void {
    this.paymentService.subscribeToPlan(plan.id).subscribe({
      next: (response) => {
        console.log('Subscription successful:', response);
        this.showPaymentModal = false;
        this.checkLessonsAccess();
        this.showSubscriptionSuccess(plan);
      },
      error: (error) => {
        console.error('Subscription failed:', error);
        this.showSubscriptionError(error);
      }
    });
  }

  // Close payment modal
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentPlans = [];
  }

  // ✅ ADMIN METHODS
  editCourse(): void {
    if (this.isAdminMode && this.course?.id) {
      this.router.navigate(['/admin-dashboard/courses', this.course.id, 'edit']);
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
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء تحديث حالة الكورس';
          this.isLoading = false;
        }
      });
  }

  viewStudents(): void {
    if (this.isAdminMode && this.course?.id) {
      this.router.navigate(['/admin-dashboard/courses', this.course.id, 'students']);
    }
  }

  // Navigation methods
  goBack(): void {
    if (this.isAdminMode) {
      this.router.navigate(['/admin-dashboard/courses']);
    } else {
      this.router.navigate(['/student-dashboard/my-courses']);
    }
  }

  // Utility methods
  private showAccessDenied(): void {
    this.errorMessage = 'ليس لديك صلاحية للوصول إلى هذا الدرس';
    setTimeout(() => this.errorMessage = '', 3000);
  }

  private showSubscriptionSuccess(plan: PaymentPlan): void {
    this.successMessage = `تم الاشتراك بنجاح في خطة: ${plan.name}`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  private showSubscriptionError(error: any): void {
    this.errorMessage = 'حدث خطأ أثناء عملية الاشتراك';
    setTimeout(() => this.errorMessage = '', 3000);
  }

  getPlanDurationLabel(duration: number): string {
    if (duration === 30) return 'شهري';
    if (duration === 180) return 'نصف سنوي';
    if (duration === 365) return 'سنوي';
    return `${duration} يوم`;
  }

  getSelectedLessonTypeInfo(): LessonTypeCard | null {
    return this.lessonTypeCards.find(card => card.isSelected) || null;
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours} ساعة ${remainingMinutes} دقيقة` : `${hours} ساعة`;
    }
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

  // ✅ NEW: Getters for template
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
    return this.isLoading || this.isLoadingUnits;
  }
}