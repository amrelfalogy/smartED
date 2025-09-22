import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject as RxSubject, firstValueFrom, of } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
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
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-courses-admin-form',
  templateUrl: './courses-admin-form.component.html',
  styleUrls: ['./courses-admin-form.component.scss']
})
export class CoursesAdminFormComponent implements OnInit, OnDestroy {
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

  courseData: CourseComplete = {
    subject: {
      name: '',
      description: '',
      difficulty: 'intermediate',
      academicYearId: '',
      studentYearId: '',
      duration: '4_months',
      imageUrl: '',
      order: 1,
      status: 'draft'
    },
    units: [],
    totalLessons: 0,
    totalDuration: 0,
    status: 'draft'
  };

  isEdit = false;
  subjectId: string | null = null;
  isLoading = false;
  isSaving = false;
  errorMsg: string | null = null;
  imageError: string | null = null;
  successMsg: string | null = null;
  isLoadingAcademicData = false;
  isLoadingStudentYears = false;
  academicDataLoaded = false;

  academicYears: AcademicYear[] = [];
  studentYears: StudentYear[] = [];

  selectedAcademicYear: AcademicYear | null = null;
  selectedStudentYear: StudentYear | null = null;
  selectedAcademicYearId: string = '';
  selectedStudentYearId: string = '';

  currentUserId: string | null = null;
  currentUserRole: 'admin' | 'teacher' | 'support' | 'student' | null = null;

  private destroy$ = new RxSubject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subjectService: SubjectService,
    private unitService: UnitService,
    private lessonService: LessonService,
    private academicYearService: AcademicYearService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeUserContext();
    this.loadAcademicYears();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- User context initialization ---  
  private initializeUserContext(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;
    this.currentUserRole = currentUser?.role as any;
    
    console.log('👤 User context initialized:', {
      currentUserId: this.currentUserId,
      currentUserRole: this.currentUserRole
    });
  }

  // --- Academic data loading ---
  private loadAcademicYears(): void {
    this.isLoadingAcademicData = true;
    this.academicDataLoaded = false;

    this.academicYearService.getActiveAcademicYears()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: years => {
          this.academicYears = years || [];
          if (!this.isEdit && this.academicYears.length > 0) {
            this.selectedAcademicYear = this.academicYears[0];
            this.selectedAcademicYearId = this.selectedAcademicYear.id;
            this.loadStudentYears(true);
          } else {
            this.isLoadingAcademicData = false;
            this.academicDataLoaded = true;
            this.deferValidation();
          }
        },
        error: err => {
          console.error(err);
          this.errorMsg = 'حدث خطأ أثناء تحميل السنوات الدراسية';
          this.isLoadingAcademicData = false;
          this.academicDataLoaded = true;
        }
      });
  }

  private loadStudentYears(initial = false): void {
    if (!this.selectedAcademicYearId) {
      this.studentYears = [];
      this.selectedStudentYear = null;
      this.selectedStudentYearId = '';
      if (initial) {
        this.isLoadingAcademicData = false;
        this.academicDataLoaded = true;
      }
      return;
    }

    if (!initial) this.isLoadingStudentYears = true;
    this.academicYearService.getStudentYears(this.selectedAcademicYearId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: list => {
          this.studentYears = list || [];

          if (!this.isEdit && this.studentYears.length > 0) {
            this.selectedStudentYear = this.studentYears[0];
            this.selectedStudentYearId = this.selectedStudentYear.id;
          }

          if (initial) {
            this.isLoadingAcademicData = false;
            this.academicDataLoaded = true;
          } else {
            this.isLoadingStudentYears = false;
          }
          this.deferValidation();
        },
        error: err => {
          console.error(err);
          this.studentYears = [];
          this.selectedStudentYear = null;
          this.selectedStudentYearId = '';
          if (initial) {
            this.isLoadingAcademicData = false;
            this.academicDataLoaded = true;
          } else {
            this.isLoadingStudentYears = false;
          }
          this.deferValidation();
        }
      });
  }

  // --- Edit mode & data loading ---
  private checkEditMode(): void {
    this.subjectId = this.route.snapshot.paramMap.get('id');
    if (this.subjectId) {
      this.isEdit = true;
      this.loadSubjectRobust();
    }
  }

  private loadSubjectRobust(): void {
    if (!this.subjectId) return;

    this.isLoading = true;
    this.errorMsg = null;

    this.subjectService.getSubject(this.subjectId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res: any) => {
          const subj: CourseSubject = (res && res.subject) ? res.subject : res;
          if (!subj || !subj.name) throw new Error('لم يتم العثور على بيانات المادة');

          const normalized: CourseSubject = {
            ...subj,
            status: subj.status || 'draft',
            difficulty: subj.difficulty || 'intermediate',
            duration: subj.duration || '4_months'
          };

          this.courseData.subject = normalized;

          const ensureAY$ = this.academicYears.length > 0
            ? of(this.academicYears)
            : this.academicYearService.getAcademicYears();

          return ensureAY$.pipe(
            switchMap((ays: AcademicYear[]) => {
              this.academicYears = ays || [];
              this.selectedAcademicYearId = normalized.academicYearId || '';
              this.selectedAcademicYear = this.selectedAcademicYearId
                ? (this.academicYears.find(a => a.id === this.selectedAcademicYearId) || null)
                : null;

              if (this.selectedAcademicYearId) {
                this.isLoadingStudentYears = true;
                return this.academicYearService.getStudentYears(this.selectedAcademicYearId).pipe(
                  switchMap((sys: StudentYear[]) => {
                    this.studentYears = sys || [];
                    this.selectedStudentYearId = normalized.studentYearId || '';
                    this.selectedStudentYear = this.selectedStudentYearId
                      ? (this.studentYears.find(s => s.id === this.selectedStudentYearId) || null)
                      : null;
                    this.isLoadingStudentYears = false;
                    return this.unitService.getUnitsBySubject(this.subjectId!);
                  })
                );
              } else {
                return this.unitService.getUnitsBySubject(this.subjectId!);
              }
            })
          );
        })
      )
      .subscribe({
        next: (units: Unit[]) => {
          this.courseData.units = Array.isArray(units) ? units : [];
          this.loadLessonsForUnits();
        },
        error: err => {
          console.error('Load subject error:', err);
          this.errorMsg = err?.message || 'حدث خطأ أثناء تحميل بيانات المادة';
          this.isLoading = false;
        }
      });
  }

  // ✅ UPDATED: Enhanced lesson loading with improved error handling and fallback
  private async loadLessonsForUnits(): Promise<void> {
    try {
      const unitIds = (this.courseData.units || [])
        .map(u => u.id)
        .filter(Boolean) as string[];
        
      if (unitIds.length === 0) {
        this.courseData.units.forEach(unit => {
          if (!Array.isArray(unit.lessons)) {
            unit.lessons = [];
          }
        });
        
        this.isLoading = false;
        this.deferValidation();
        return;
      }

      console.log('🔄 Loading lessons for units:', unitIds);

      // ✅ Try to load lessons for each unit with fallback
      const lessonsPerUnit = await Promise.all(
        unitIds.map(async (id, index) => {
          try {
            console.log(`🔍 Loading lessons for unit ${id} (${index + 1}/${unitIds.length})`);
            // Try main method first
            const lessons = await firstValueFrom(this.lessonService.getLessonsByUnit(id));
            console.log(`✅ Main method success for unit ${id}: ${lessons.length} lessons`);
            return lessons;
          } catch (error) {
            console.warn(`⚠️ Main method failed for unit ${id}, trying fallback:`, error);
            try {
              // Fallback to client-side filtering
              const lessons = await firstValueFrom(this.lessonService.getLessonsByUnitClientSide(id));
              console.log(`✅ Fallback method success for unit ${id}: ${lessons.length} lessons`);
              return lessons;
            } catch (fallbackError) {
              console.error(`❌ Both methods failed for unit ${id}:`, fallbackError);
              return []; // Return empty array as final fallback
            }
          }
        })
      );
      
      lessonsPerUnit.forEach((lessons, idx) => {
        // ✅ Ensure lessons is array and normalize data
        const normalizedLessons = Array.isArray(lessons) ? lessons : [];
        this.courseData.units[idx].lessons = normalizedLessons;
        
        console.log(`📚 Loaded ${normalizedLessons.length} lessons for unit ${this.courseData.units[idx].name}`);
      });

      this.recalculateTotals();
      this.isLoading = false;
      this.deferValidation();
    } catch (err) {
      console.error('❌ Error loading lessons:', err);
      
      this.courseData.units.forEach(unit => {
        if (!Array.isArray(unit.lessons)) {
          unit.lessons = [];
        }
      });
      
      this.errorMsg = 'حدث خطأ أثناء تحميل الدروس';
      this.isLoading = false;
    }
  }

  // --- Child events ---
  onSubjectUpdated(subjectData: CourseSubject): void {
    this.courseData.subject = {
      ...this.courseData.subject,
      ...subjectData,
      difficulty: subjectData.difficulty || 'intermediate',
      duration: subjectData.duration || '4_months',
      academicYearId: this.selectedAcademicYearId || subjectData.academicYearId,
      studentYearId: this.selectedStudentYearId || subjectData.studentYearId
    };
    this.formState.isDirty = true;
    this.clearMessages();
    this.deferValidation();
  }

  onAcademicYearIdChange(id: string): void {
    this.selectedAcademicYearId = id || '';
    this.selectedAcademicYear = this.academicYears.find(a => a.id === this.selectedAcademicYearId) || null;

    this.selectedStudentYear = null;
    this.selectedStudentYearId = '';
    this.studentYears = [];

    this.courseData.subject.academicYearId = this.selectedAcademicYearId || '';
    this.courseData.subject.studentYearId = '';

    if (this.selectedAcademicYearId) {
      this.loadStudentYears(false);
    } else {
      this.deferValidation();
    }
  }

  onStudentYearIdChange(id: string): void {
    this.selectedStudentYearId = id || '';
    this.selectedStudentYear = this.studentYears.find(s => s.id === this.selectedStudentYearId) || null;

    this.courseData.subject.studentYearId = this.selectedStudentYearId || '';
    this.formState.isDirty = true;
    this.deferValidation();
  }

  onUnitsUpdated(units: Unit[]): void {
    Promise.resolve().then(() => {
      this.courseData.units = [...units];
      this.formState.isDirty = true;
      this.recalculateTotals();
      this.clearMessages();
      this.deferValidation();
    });
  }

  // --- Normalization: ensure every lesson has a unitId before save ---
  private normalizeLessonUnitIds(): void {
    for (const unit of this.courseData.units || []) {
      const uId = unit.id || '';
      if (unit.lessons && unit.lessons.length > 0) {
        unit.lessons.forEach(l => {
          if (!l.unitId || l.unitId.trim() === '') {
            l.unitId = uId || l.lectureId || '';
          }
        });
      }
    }
  }

  // --- Validation (lesson.sessionType removed; subject.sessionType required) ---
  private deferValidation(): void {
    setTimeout(() => {
      this.updateStepValidation(1, this.isSubjectValid(this.courseData.subject));
      this.updateStepValidation(2, this.areUnitsValid(this.courseData.units));
      this.cdr.detectChanges();
    });
  }

  private isSubjectValid(subject: CourseSubject): boolean {
    const basic =
      !!subject.name?.trim() &&
      !!subject.description?.trim() &&
      !!subject.difficulty &&
      !!subject.duration?.trim() &&
      !!subject.imageUrl?.trim() &&
      subject.order > 0;
    const academicOk = !!(this.selectedAcademicYearId && this.selectedStudentYearId);
    const stOk = !!(subject as any).sessionType; // required by backend
    return basic && academicOk && stOk;
  }

  // ✅ FIX: Update units validation
  private areUnitsValid(units: Unit[]): boolean {
    if (units.length === 0) return false;
    
    return units.every(u => {
      const lessons = Array.isArray(u.lessons) ? u.lessons : [];
      const unitBasicValid = !!(u.name?.trim() && u.description?.trim());
      const hasLessons = lessons.length > 0;
      const allLessonsValid = lessons.every(l => this.isLessonValid(l));
      
      return unitBasicValid && hasLessons && allLessonsValid;
    });
  }

  private isLessonValid(lesson: Lesson): boolean {
  const basicValid = !!(
    lesson.title?.trim() &&
    lesson.description?.trim() &&
    lesson.lessonType &&
    lesson.difficulty &&
    (lesson.duration ?? 0) >= 0
  );
  
  // ✅ Content validation based on lesson type
  let contentValid = true;
  if (lesson.lessonType === 'video') {
    contentValid = !!lesson.videoUrl;
  } else if (lesson.lessonType === 'pdf' || lesson.lessonType === 'document') {
    contentValid = !!lesson.pdfUrl;
  }
  
  // ✅ Price validation
  const priceValid = lesson.isFree || (!lesson.isFree && (lesson.price ?? 0) >= 0);
  
  return basicValid && contentValid && priceValid;
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

  // --- Totals / Navigation ---
  private recalculateTotals(): void {
    this.courseData.totalLessons = this.courseData.units.reduce(
      (acc, u) => {
        // ✅ FIX: Add null checks and ensure lessons is array
        const lessons = Array.isArray(u.lessons) ? u.lessons : [];
        return acc + lessons.length;
      }, 0
    );
    
    this.courseData.totalDuration = this.courseData.units.reduce(
      (acc, u) => {
        // ✅ FIX: Add null checks and ensure lessons is array
        const lessons = Array.isArray(u.lessons) ? u.lessons : [];
        const unitDuration = lessons.reduce((lt, l) => lt + (l.duration || 0), 0);
        return acc + unitDuration;
      }, 0
    );
  }

  goToStep(step: number): void {
    if (this.canNavigateTo(step)) {
      this.formState.currentStep = step;
      this.clearMessages();
    }
  }

  private canNavigateTo(step: number): boolean {
    if (step <= this.formState.currentStep) return true;
    for (let i = 1; i < step; i++) {
      const s = this.formState.steps.find(st => st.id === i);
      if (!s?.isValid) return false;
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

  // --- Save / Publish / Unpublish ---
  async saveCourse(): Promise<void> {
    if (!this.formState.isValid) {
      this.errorMsg = 'يرجى استكمال جميع البيانات المطلوبة';
      return;
    }
    this.isSaving = true;
    this.errorMsg = null;

    try {
      // Ensure unitId on every lesson before any API call
      this.normalizeLessonUnitIds();

      if (this.isEdit) {
        await this.updateExistingCourse();
      } else {
        await this.createNewCourse();
      }
      this.successMsg = this.courseData.subject.status === 'published'
        ? 'تم حفظ التعديلات'
        : 'تم حفظ الكورس بنجاح';
      this.formState.isDirty = false;
    } catch (err: any) {
      const details =
        err?.friendlyMessage ||
        (err?.error?.details
          ? err.error.details.map((d: any) => `${d.field}: ${d.message}`).join(' | ')
          : null) ||
        err?.error?.message ||
        err?.message ||
        'حدث خطأ أثناء حفظ الكورس';
      this.errorMsg = details;
      console.error(err);
    } finally {
      this.isSaving = false;
    }
  }

  async publishCourse(): Promise<void> {
    await this.saveCourse();
    if (this.successMsg && this.subjectId) {
      try {
        const updatedSubject = { ...this.courseData.subject, status: 'published' as const };
        const updated: CourseSubject = await firstValueFrom(
          this.subjectService.updateSubject(this.subjectId, updatedSubject)
        );
        this.courseData.subject.status = updated.status || 'published';
        this.successMsg = 'تم نشر الكورس بنجاح';
      } catch (e) {
        console.error(e);
        this.errorMsg = 'تعذر نشر الكورس';
      }
    }
  }

  async unpublishCourse(): Promise<void> {
    if (!this.subjectId) return;
    try {
      this.isSaving = true;
      const updatedSubject = { ...this.courseData.subject, status: 'draft' as const };
      const updated: CourseSubject = await firstValueFrom(
        this.subjectService.updateSubject(this.subjectId, updatedSubject)
      );
      this.courseData.subject.status = updated.status || 'draft';
      this.successMsg = 'تم إلغاء نشر الكورس';
    } catch (e) {
      console.error(e);
      this.errorMsg = 'تعذر إلغاء نشر الكورس';
    } finally {
      this.isSaving = false;
    }
  }

  private async createNewCourse(): Promise<void> {
    if (this.selectedAcademicYearId) {
      this.courseData.subject.academicYearId = this.selectedAcademicYearId;
    }
    if (this.selectedStudentYearId) {
      this.courseData.subject.studentYearId = this.selectedStudentYearId;
    }

    this.courseData.subject.difficulty = this.courseData.subject.difficulty || 'intermediate';
    this.courseData.subject.duration = this.courseData.subject.duration || '4_months';

    const createdSubject: CourseSubject = await firstValueFrom(
      this.subjectService.createSubject(this.courseData.subject)
    );

    if (!createdSubject.id) {
      throw new Error('فشل إنشاء المادة');
    }

    this.subjectId = createdSubject.id;
    this.courseData.subject = { ...createdSubject, status: createdSubject.status || 'draft' };
    this.isEdit = true;

    // Create units then lessons
    for (const unit of this.courseData.units) {
      await this.createUnitWithLessons(unit, createdSubject.id);
    }
  }

  private async updateExistingCourse(): Promise<void> {
    if (!this.subjectId) return;

    this.courseData.subject.difficulty = this.courseData.subject.difficulty || 'intermediate';
    this.courseData.subject.duration = this.courseData.subject.duration || '4_months';

    const updatedSubject: CourseSubject = await firstValueFrom(
      this.subjectService.updateSubject(this.subjectId, this.courseData.subject)
    );
    this.courseData.subject = {
      ...updatedSubject,
      status: updatedSubject.status || this.courseData.subject.status || 'draft'
    };

    for (const unit of this.courseData.units) {
      if (unit.id) {
        if (unit.lessons) {
          for (const lesson of unit.lessons) {
            if (lesson.id) {
              const ensuredUnitId = lesson.unitId || unit.id || lesson.lectureId || '';
              if (!ensuredUnitId) {
                throw new Error(`unitId مفقود لهذا الدرس: ${lesson.title || lesson.id}`);
              }

              await firstValueFrom(
                this.lessonService.updateLesson(lesson.id, {
                  title: lesson.title,
                  description: lesson.description,
                  lessonType: lesson.lessonType,
                  difficulty: lesson.difficulty,
                  duration: lesson.duration,
                  isFree: lesson.isFree,
                  isActive: lesson.isActive,
                  order: lesson.order,
                  unitId: ensuredUnitId
                })
              );
            } else {
              // NEW lesson in EXISTING unit
              const ensuredUnitId = unit.id || lesson.unitId || lesson.lectureId || '';
              if (!ensuredUnitId) {
                throw new Error(`unitId مفقود لهذا الدرس الجديد: ${lesson.title || '(بدون عنوان)'}`);
              }
              await this.createLesson(lesson, ensuredUnitId);
            }
          }
        }
      } else {
        // NEW unit: create, then its lessons with the created unitId
        await this.createUnitWithLessons(unit, this.subjectId);
      }
    }
  }

  private async createUnitWithLessons(unit: Unit, subjectId: string): Promise<void> {
    const createdUnit: Unit = await firstValueFrom(
      this.unitService.createUnit({
        name: unit.name,
        description: unit.description,
        subjectId,
        order: unit.order
      })
    );

    if (!createdUnit?.id) {
      throw new Error(`لم يتم استرجاع معرف للوحدة الجديدة "${unit.name}"`);
    }

    if (unit.lessons?.length) {
      for (const lesson of unit.lessons) {
        await this.createLesson(lesson, createdUnit.id);
      }
    }
  }

  private async createLesson(lesson: Lesson, unitId: string): Promise<void> {
    if (!unitId || unitId.trim() === '') {
      throw new Error(`unitId مفقود أثناء إنشاء الدرس "${lesson.title || ''}"`);
    }

    await firstValueFrom(
      this.lessonService.createLesson({
        title: lesson.title,
        description: lesson.description,
        unitId, // REQUIRED
        order: lesson.order,
        price: lesson.price || 0,
        videoUrl: lesson.videoUrl || '',
        pdfUrl: lesson.pdfUrl || '',
        duration: lesson.duration,
        lessonType: lesson.lessonType,
        difficulty: lesson.difficulty,
        isFree: lesson.isFree,
        isActive: lesson.isActive
      })
    );
  }

  // Utility
  cancel(): void {
    if (this.formState.isDirty && !confirm('هل أنت متأكد من إلغاء التعديلات؟')) {
      return;
    }
    this.router.navigate(['/admin/courses']);
  }

  clearMessages(): void {
    this.errorMsg = null;
    this.successMsg = null;
  }

  get isFirstStep(): boolean { return this.formState.currentStep === 1; }
  get isLastStep(): boolean { return this.formState.currentStep === this.formState.steps.length; }
  get canGoNext(): boolean {
    return !!this.formState.steps.find(s => s.id === this.formState.currentStep)?.isValid;
  }
  get progressPercentage(): number {
    const completed = this.formState.steps.filter(s => s.isCompleted).length;
    return (completed / this.formState.steps.length) * 100;
  }

  formatDuration(seconds: number): string {
    const h = Math.floor((seconds || 0) / 3600);
    const m = Math.floor(((seconds || 0) % 3600) / 60);
    if (h > 0) return `${h}س ${m}د`;
    return `${m}د`;
  }
}