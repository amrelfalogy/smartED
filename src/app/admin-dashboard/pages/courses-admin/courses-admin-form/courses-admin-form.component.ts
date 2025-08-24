import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  CourseComplete, 
  Subject as CourseSubject, 
  Unit, 
  Lesson,
  CourseFormState 
} from 'src/app/core/models/course-complete.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { UnitService } from 'src/app/core/services/unit.service';
import { LessonService } from 'src/app/core/services/lesson.service';
import { AcademicYearService } from 'src/app/core/services/academic-year.service';
import { AcademicYear, StudentYear } from 'src/app/core/models/academic-year.model';

@Component({
  selector: 'app-courses-admin-form',
  templateUrl: './courses-admin-form.component.html',
  styleUrls: ['./courses-admin-form.component.scss']
})
export class CoursesAdminFormComponent implements OnInit, OnDestroy {
  // Form state
  formState: CourseFormState = {
    currentStep: 1,
    steps: [
      { id: 1, title: 'معلومات المادة', isCompleted: false, isValid: false, hasErrors: false },
      { id: 2, title: 'الوحدات والدروس', isCompleted: false, isValid: false, hasErrors: false },
      { id: 3, title: 'المراجعة والنشر', isCompleted: false, isValid: false, hasErrors: false }
    ],
    isValid: false,
    isDirty: false
  };

  // Course data
  courseData: CourseComplete = {
    subject: {
      name: '',
      description: '',
      difficulty: 'beginner',
      duration: '',
      imageUrl: '',
      order: 1
    },
    units: [],
    totalLessons: 0,
    totalDuration: 0,
    status: 'draft'
  };

  // Component state
  isEdit = false;
  subjectId: string | null = null;
  isLoading = false;
  isSaving = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;

  // Data for child components
  academicYears: AcademicYear[] = [];
  studentYears: StudentYear[] = []; 
  selectedAcademicYear: AcademicYear | null = null;
  selectedStudentYear: StudentYear | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subjectService: SubjectService,
    private unitService: UnitService,
    private lessonService: LessonService,
    private academicYearService: AcademicYearService
  ) {}

  ngOnInit(): void {
    this.loadAcademicYears();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

    private loadAcademicYears(): void {
    this.academicYearService.getAcademicYears()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (years) => {
          console.log('Academic Years loaded:', years); 
          this.academicYears = years;
          if (years.length > 0) {
            this.selectedAcademicYear = years[0];
            this.loadStudentYears();
          }
        },
        error: (error) => {
          this.errorMsg = 'حدث خطأ أثناء تحميل السنوات الدراسية';
          console.error('Error loading academic years:', error);
        }
      });
  }

  private loadStudentYears(): void {
    if (this.selectedAcademicYear) {
      this.academicYearService.getStudentYears(this.selectedAcademicYear.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (studentYears) => {
            this.studentYears = studentYears; // <-- store in property
            if (studentYears.length > 0) {
              this.selectedStudentYear = studentYears[0];
            } else {
              this.selectedStudentYear = null;
            }
          },
          error: (error) => {
            this.studentYears = [];
            this.selectedStudentYear = null;
            console.error('Error loading student years:', error);
          }
        });
    } else {
      this.studentYears = [];
      this.selectedStudentYear = null;
    }
  }

  private checkEditMode(): void {
    this.subjectId = this.route.snapshot.paramMap.get('id');
    if (this.subjectId) {
      this.isEdit = true;
      this.loadSubjectData();
    }
  }

  private loadSubjectData(): void {
    if (!this.subjectId) return;

    this.isLoading = true;
    
    this.subjectService.getSubject(this.subjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subject) => {
          this.courseData.subject = subject;
          this.loadUnitsData();
        },
        error: (error) => {
          this.errorMsg = 'حدث خطأ أثناء تحميل بيانات المادة';
          this.isLoading = false;
          console.error('Error loading subject:', error);
        }
      });
  }

  private loadUnitsData(): void {
    if (!this.subjectId) return;

    this.unitService.getUnitsBySubject(this.subjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.courseData.units = units;
          this.loadAllLessons();
        },
        error: (error) => {
          this.errorMsg = 'حدث خطأ أثناء تحميل الوحدات';
          this.isLoading = false;
          console.error('Error loading units:', error);
        }
      });
  }

  private loadAllLessons(): void {
    const unitIds = this.courseData.units.map(unit => unit.id).filter(id => id);
    
    if (unitIds.length === 0) {
      this.isLoading = false;
      this.updateStepsValidation();
      return;
    }

    const lessonRequests = unitIds.map(unitId => 
      this.lessonService.getLessonsByUnit(unitId!)
    );

    Promise.all(lessonRequests.map(req => req.toPromise()))
      .then(allLessons => {
        this.courseData.units.forEach((unit, index) => {
          unit.lessons = allLessons[index] || [];
        });
        
        this.calculateTotals();
        this.updateStepsValidation();
        this.isLoading = false;
      })
      .catch(error => {
        this.errorMsg = 'حدث خطأ أثناء تحميل الدروس';
        this.isLoading = false;
        console.error('Error loading lessons:', error);
      });
  }

  // Step navigation
  goToStep(stepNumber: number): void {
    if (this.canNavigateToStep(stepNumber)) {
      this.formState.currentStep = stepNumber;
      this.clearMessages();
    }
  }

  private canNavigateToStep(stepNumber: number): boolean {
    if (stepNumber <= this.formState.currentStep) return true;
    
    for (let i = 1; i < stepNumber; i++) {
      const step = this.formState.steps.find(s => s.id === i);
      if (!step?.isValid) return false;
    }
    return true;
  }

  nextStep(): void {
    if (this.formState.currentStep < this.formState.steps.length) {
      this.formState.currentStep++;
    }
  }

  previousStep(): void {
    if (this.formState.currentStep > 1) {
      this.formState.currentStep--;
    }
  }

  // Event handlers from child components
  onSubjectUpdated(subjectData: CourseSubject): void {
    this.courseData.subject = { ...subjectData };
    this.formState.isDirty = true;
    this.updateStepValidation(1, this.isSubjectValid(subjectData));
    this.clearMessages();
  }

  onUnitsUpdated(units: Unit[]): void {
    this.courseData.units = [...units];
    this.formState.isDirty = true;
    this.updateStepValidation(2, this.areUnitsValid(units));
    this.calculateTotals();
    this.clearMessages();
  }

 onAcademicYearChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedId = target.value;
    this.selectedAcademicYear = this.academicYears.find(ay => ay.id === selectedId) || null;
    this.loadStudentYears();
  }

   onStudentYearChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedId = target.value;
    this.selectedStudentYear = this.studentYears.find(sy => sy.id === selectedId) || null;
  }

  // Validation methods
  private isSubjectValid(subject: CourseSubject): boolean {
    return !!(
      subject.name?.trim() &&
      subject.description?.trim() &&
      subject.difficulty &&
      subject.duration?.trim() &&
      subject.order > 0
    );
  }

  private areUnitsValid(units: Unit[]): boolean {
    return units.length > 0 && 
           units.every(unit => 
             unit.name?.trim() && 
             unit.title?.trim() &&
             unit.description?.trim() &&
             unit.lessons && unit.lessons.length > 0 &&
             unit.lessons.every(lesson => this.isLessonValid(lesson))
           );
  }

  private isLessonValid(lesson: Lesson): boolean {
    return !!(
      lesson.name?.trim() &&
      lesson.title?.trim() &&
      lesson.description?.trim() &&
      lesson.duration > 0 &&
      lesson.lessonType &&
      lesson.sessionType &&
      lesson.difficulty
    );
  }

  private updateStepValidation(stepId: number, isValid: boolean): void {
    const step = this.formState.steps.find(s => s.id === stepId);
    if (step) {
      step.isValid = isValid;
      step.isCompleted = isValid;
      step.hasErrors = !isValid;
    }
    this.formState.isValid = this.formState.steps.slice(0, 2).every(s => s.isValid);
  }

  private updateStepsValidation(): void {
    this.updateStepValidation(1, this.isSubjectValid(this.courseData.subject));
    this.updateStepValidation(2, this.areUnitsValid(this.courseData.units));
  }

  private calculateTotals(): void {
    this.courseData.totalLessons = this.courseData.units.reduce(
      (total, unit) => total + (unit.lessons?.length || 0), 0
    );
    
    this.courseData.totalDuration = this.courseData.units.reduce(
      (total, unit) => total + (unit.lessons?.reduce(
        (unitTotal, lesson) => unitTotal + (lesson.duration || 0), 0
      ) || 0), 0
    );
  }

  // Save operations
  async saveCourse(): Promise<void> {
     console.log('saveCourse called', this.courseData, this.formState);
    if (!this.formState.isValid) {
      this.errorMsg = 'يرجى استكمال جميع البيانات المطلوبة';
          console.log('Form is not valid');
      return;
    }

    this.isSaving = true;
    this.errorMsg = null;

    try {
      if (this.isEdit) {
        console.log('Updating existing course');
        await this.updateExistingCourse();
      } else {
        console.log('Creating new course');
        await this.createNewCourse();
      }
      
      this.successMsg = 'تم حفظ الكورس بنجاح';
      this.formState.isDirty = false;
      console.log('Course saved successfully');
    } catch (error) {
      this.errorMsg = 'حدث خطأ أثناء حفظ الكورس';
      console.error('Error saving course:', error);
    } finally {
      this.isSaving = false;
    }
  }

  private async createNewCourse(): Promise<void> {
    const createdSubject = await this.subjectService.createSubject(this.courseData.subject).toPromise();
    console.log('Created subject:', createdSubject);
    if (!createdSubject?.id) {
      throw new Error('Subject creation failed');
    }

    this.subjectId = createdSubject.id;
    this.isEdit = true;

    for (const unit of this.courseData.units) {
      await this.createUnitWithLessons(unit, createdSubject.id);
    }
  }

  private async updateExistingCourse(): Promise<void> {
    if (!this.subjectId) return;

    await this.subjectService.updateSubject(this.subjectId, this.courseData.subject).toPromise();

    for (const unit of this.courseData.units) {
      if (unit.id) {
        await this.unitService.updateUnit(unit.id, unit).toPromise();
        
        if (unit.lessons) {
          for (const lesson of unit.lessons) {
            if (lesson.id) {
              await this.lessonService.updateLesson(lesson.id, lesson).toPromise();
            } else {
              await this.createLesson(lesson, unit.id);
            }
          }
        }
      } else {
        await this.createUnitWithLessons(unit, this.subjectId);
      }
    }
  }

  private async createUnitWithLessons(unit: Unit, subjectId: string): Promise<void> {
    const unitData = {
      name: unit.name,
      title: unit.title,
      description: unit.description,
      subjectId: subjectId,
      order: unit.order
    };

    const createdUnit = await this.unitService.createUnit(unitData).toPromise();
    
    if (!createdUnit?.id) {
      throw new Error('Unit creation failed');
    }

    if (unit.lessons && unit.lessons.length > 0) {
      for (const lesson of unit.lessons) {
        await this.createLesson(lesson, createdUnit.id);
      }
    }
  }

  private async createLesson(lesson: Lesson, unitId: string): Promise<void> {
    if (!this.selectedAcademicYear || !this.selectedStudentYear) {
      throw new Error('Academic year and student year must be selected');
    }

    const lessonData = {
      name: lesson.name,
      title: lesson.title,
      description: lesson.description,
      lectureId: unitId,
      duration: lesson.duration,
      lessonType: lesson.lessonType,
      sessionType: lesson.sessionType,
      academicYearId: this.selectedAcademicYear.id,
      studentYearId: this.selectedStudentYear.id,
      isFree: lesson.isFree,
      difficulty: lesson.difficulty,
      order: lesson.order
    };

    await this.lessonService.createLesson(lessonData).toPromise();
  }

  async publishCourse(): Promise<void> {
    console.log('publishCourse called');
    await this.saveCourse();
    
    if (this.successMsg && this.subjectId) {
        console.log('Publishing course', this.subjectId);
      this.courseData.status = 'published';
      this.successMsg = 'تم نشر الكورس بنجاح';
      
      setTimeout(() => {
        this.router.navigate(['/admin-dashboard/courses']);
      }, 2000);
    }
  }

  // Utility methods
  private clearMessages(): void {
    this.errorMsg = null;
    this.successMsg = null;
  }

  cancel(): void {
    if (this.formState.isDirty) {
      if (confirm('هل أنت متأكد من إلغاء التعديلات؟')) {
        this.router.navigate(['/admin-dashboard/courses']);
      }
    } else {
      this.router.navigate(['/admin-dashboard/courses']);
    }
  }

  // Getters for template
  get isFirstStep(): boolean { return this.formState.currentStep === 1; }
  get isLastStep(): boolean { return this.formState.currentStep === this.formState.steps.length; }
  get canGoNext(): boolean { 
    return this.formState.steps.find(s => s.id === this.formState.currentStep)?.isValid || false; 
  }
  get progressPercentage(): number {
    const completedSteps = this.formState.steps.filter(s => s.isCompleted).length;
    return (completedSteps / this.formState.steps.length) * 100;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    return `${minutes}د`;
  }
}