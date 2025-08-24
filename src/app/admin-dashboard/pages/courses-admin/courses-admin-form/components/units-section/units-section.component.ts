import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  Unit, 
  Lesson, 
  Subject as CourseSubject 
} from 'src/app/core/models/course-complete.model';

@Component({
  selector: 'app-units-section',
  templateUrl: './units-section.component.html',
  styleUrls: ['./units-section.component.scss']
})
export class UnitsSectionComponent implements OnInit, OnDestroy {
  @Input() units: Unit[] = [];
  @Input() subjectData!: CourseSubject;
  @Input() academicYearId!: string;
  @Input() studentYearId!: string;
  @Output() unitsUpdated = new EventEmitter<Unit[]>();

  unitsForm!: FormGroup;
  expandedUnit: number | null = null;
  isFormValid = false;

  // Lesson configuration options
  lessonTypes = [
    { 
      value: 'center_recorded', 
      label: 'تسجيل مركز', 
      icon: 'record_voice_over',
      description: 'تسجيل صوتي ومرئي من المركز التعليمي'
    },
    { 
      value: 'studio_produced', 
      label: 'إنتاج استوديو', 
      icon: 'video_camera_front',
      description: 'فيديو مُنتج بجودة عالية في الاستوديو'
    }
  ];

  sessionTypes = [
    { value: 'recorded', label: 'مسجل', icon: 'videocam' },
    { value: 'live', label: 'مباشر', icon: 'live_tv' }
  ];

  difficultyOptions = [
    { value: 'beginner', label: 'مبتدئ', color: '#10b981' },
    { value: 'intermediate', label: 'متوسط', color: '#f59e0b' },
    { value: 'advanced', label: 'متقدم', color: '#ef4444' }
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
    this.unitsForm = this.fb.group({
      units: this.fb.array([])
    });

    // Load existing units or create first unit
    if (this.units && this.units.length > 0) {
      this.units.forEach(unit => this.addUnitToForm(unit));
    } else {
      this.addUnit(); // Create first unit automatically
    }
  }

  private setupFormSubscription(): void {
    this.unitsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateForm();
        this.emitUnitsUpdate();
      });
  }

  // Form Array Getters
  get unitsFormArray(): FormArray {
    return this.unitsForm.get('units') as FormArray;
  }

  getLessonsFormArray(unitIndex: number): FormArray {
    return this.unitsFormArray.at(unitIndex).get('lessons') as FormArray;
  }

  // Unit Form Creation
  private createUnitFormGroup(unit?: Unit): FormGroup {
    return this.fb.group({
      id: [unit?.id || null],
      name: [unit?.name || '', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
       title: [unit?.title || '', [ 
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: [unit?.description || '', [
        Validators.required, 
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      subjectId: [unit?.subjectId || ''],
      order: [unit?.order || this.unitsFormArray.length + 1, [
        Validators.required, 
        Validators.min(1)
      ]],
      lessons: this.fb.array(
        unit?.lessons?.map(lesson => this.createLessonFormGroup(lesson)) || []
      ),
      isActive: [unit?.isActive ?? true]
    });
  }

  // Lesson Form Creation
  private createLessonFormGroup(lesson?: Lesson): FormGroup {
    return this.fb.group({
      id: [lesson?.id || null],
      name: [lesson?.name || '', [Validators.required]],
      title: [lesson?.title || '', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: [lesson?.description || '', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      lectureId: [lesson?.lectureId || ''],
      duration: [lesson?.duration || 1800, [
        Validators.required, 
        Validators.min(60)
      ]],
      lessonType: [lesson?.lessonType || 'center_recorded', Validators.required],
      sessionType: [lesson?.sessionType || 'recorded', Validators.required],
      academicYearId: [lesson?.academicYearId || this.academicYearId],
      studentYearId: [lesson?.studentYearId || this.studentYearId],
      isFree: [lesson?.isFree ?? false],
      difficulty: [lesson?.difficulty || 'beginner', Validators.required],
      order: [lesson?.order || 1, [Validators.required, Validators.min(1)]],
      isActive: [lesson?.isActive ?? true]
    });
  }

  // Unit Management
  addUnit(): void {
    const unitGroup = this.createUnitFormGroup();
    
    const newOrder = this.unitsFormArray.length + 1;
    unitGroup.patchValue({ 
      order: newOrder,
      subjectId: this.subjectData?.id || ''
    });
    
    this.unitsFormArray.push(unitGroup);
    this.expandedUnit = this.unitsFormArray.length - 1;
    
    // Add first lesson automatically
    this.addLesson(this.unitsFormArray.length - 1);
  }

  addUnitToForm(unit: Unit): void {
    const unitGroup = this.createUnitFormGroup(unit);
    this.unitsFormArray.push(unitGroup);
  }

  removeUnit(index: number): void {
    if (this.unitsFormArray.length <= 1) {
      alert('يجب أن يحتوي الكورس على وحدة واحدة على الأقل');
      return;
    }

    if (confirm('هل أنت متأكد من حذف هذه الوحدة؟ سيتم حذف جميع الدروس المرتبطة بها.')) {
      this.unitsFormArray.removeAt(index);
      this.reorderUnits();
      
      if (this.expandedUnit === index) {
        this.expandedUnit = null;
      } else if (this.expandedUnit !== null && this.expandedUnit > index) {
        this.expandedUnit--;
      }
    }
  }

  // 🔄 SIMPLE REORDERING WITH BUTTONS
  moveUnitUp(index: number): void {
    if (index > 0) {
      const unitsArray = this.unitsFormArray;
      const currentUnit = unitsArray.at(index);
      const previousUnit = unitsArray.at(index - 1);
      
      // Swap positions
      unitsArray.setControl(index, previousUnit);
      unitsArray.setControl(index - 1, currentUnit);
      
      this.reorderUnits();
      
      // Update expanded unit index
      if (this.expandedUnit === index) {
        this.expandedUnit = index - 1;
      } else if (this.expandedUnit === index - 1) {
        this.expandedUnit = index;
      }
    }
  }

  moveUnitDown(index: number): void {
    if (index < this.unitsFormArray.length - 1) {
      const unitsArray = this.unitsFormArray;
      const currentUnit = unitsArray.at(index);
      const nextUnit = unitsArray.at(index + 1);
      
      // Swap positions
      unitsArray.setControl(index, nextUnit);
      unitsArray.setControl(index + 1, currentUnit);
      
      this.reorderUnits();
      
      // Update expanded unit index
      if (this.expandedUnit === index) {
        this.expandedUnit = index + 1;
      } else if (this.expandedUnit === index + 1) {
        this.expandedUnit = index;
      }
    }
  }

  // Lesson Management
  addLesson(unitIndex: number): void {
    const lessonsArray = this.getLessonsFormArray(unitIndex);
    const lessonGroup = this.createLessonFormGroup();
    
    const lessonOrder = lessonsArray.length + 1;
    const unitName = this.unitsFormArray.at(unitIndex).get('name')?.value || 'unit';
    
    lessonGroup.patchValue({ 
      order: lessonOrder,
      name: this.generateLessonName(`${unitName}-lesson-${lessonOrder}`),
      academicYearId: this.academicYearId,
      studentYearId: this.studentYearId
    });
    
    lessonsArray.push(lessonGroup);
  }

  removeLesson(unitIndex: number, lessonIndex: number): void {
    const lessonsArray = this.getLessonsFormArray(unitIndex);
    
    if (lessonsArray.length <= 1) {
      alert('يجب أن تحتوي كل وحدة على درس واحد على الأقل');
      return;
    }

    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      lessonsArray.removeAt(lessonIndex);
      this.reorderLessons(unitIndex);
    }
  }

  // 🔄 SIMPLE LESSON REORDERING WITH BUTTONS
  moveLessonUp(unitIndex: number, lessonIndex: number): void {
    if (lessonIndex > 0) {
      const lessonsArray = this.getLessonsFormArray(unitIndex);
      const currentLesson = lessonsArray.at(lessonIndex);
      const previousLesson = lessonsArray.at(lessonIndex - 1);
      
      // Swap positions
      lessonsArray.setControl(lessonIndex, previousLesson);
      lessonsArray.setControl(lessonIndex - 1, currentLesson);
      
      this.reorderLessons(unitIndex);
    }
  }

  moveLessonDown(unitIndex: number, lessonIndex: number): void {
    const lessonsArray = this.getLessonsFormArray(unitIndex);
    if (lessonIndex < lessonsArray.length - 1) {
      const currentLesson = lessonsArray.at(lessonIndex);
      const nextLesson = lessonsArray.at(lessonIndex + 1);
      
      // Swap positions
      lessonsArray.setControl(lessonIndex, nextLesson);
      lessonsArray.setControl(lessonIndex + 1, currentLesson);
      
      this.reorderLessons(unitIndex);
    }
  }

  // Helper Methods
  private generateLessonName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  onLessonTitleChange(unitIndex: number, lessonIndex: number): void {
    const lessonForm = this.getLessonsFormArray(unitIndex).at(lessonIndex);
    const title = lessonForm.get('title')?.value;
    
    if (title && !lessonForm.get('name')?.value) {
      const generatedName = this.generateLessonName(title);
      lessonForm.patchValue({ name: generatedName });
    }
  }

  // Duration Conversion
  updateLessonDuration(unitIndex: number, lessonIndex: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const minutes = +target.value;
  
  if (minutes && minutes > 0) {
    const seconds = minutes * 60;
    const lessonForm = this.getLessonsFormArray(unitIndex).at(lessonIndex);
    lessonForm.patchValue({ duration: seconds });
    }
  }

  getDurationInMinutes(seconds: number): number {
    return Math.round(seconds / 60);
  }

  // Reordering
  private reorderUnits(): void {
    this.unitsFormArray.controls.forEach((control, index) => {
      control.patchValue({ order: index + 1 });
    });
  }

  private reorderLessons(unitIndex: number): void {
    const lessonsArray = this.getLessonsFormArray(unitIndex);
    lessonsArray.controls.forEach((control, index) => {
      control.patchValue({ order: index + 1 });
    });
  }

  // UI Interaction
  toggleUnitExpansion(index: number): void {
    this.expandedUnit = this.expandedUnit === index ? null : index;
  }

  // Validation
  private validateForm(): void {
    this.isFormValid = this.unitsForm.valid && this.unitsFormArray.length > 0;
    
    for (let i = 0; i < this.unitsFormArray.length; i++) {
      const lessonsArray = this.getLessonsFormArray(i);
      if (lessonsArray.length === 0) {
        this.isFormValid = false;
        break;
      }
    }
  }

  isUnitFieldInvalid(unitIndex: number, fieldName: string): boolean {
    const field = this.unitsFormArray.at(unitIndex).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isLessonFieldInvalid(unitIndex: number, lessonIndex: number, fieldName: string): boolean {
    const field = this.getLessonsFormArray(unitIndex).at(lessonIndex).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(control: any): string {
    if (control?.errors) {
      if (control.errors['required']) return 'هذا الحقل مطلوب';
      if (control.errors['minlength']) return `الحد الأدنى ${control.errors['minlength'].requiredLength} أحرف`;
      if (control.errors['maxlength']) return `الحد الأقصى ${control.errors['maxlength'].requiredLength} حرف`;
      if (control.errors['min']) return `القيمة يجب أن تكون أكبر من ${control.errors['min'].min}`;
    }
    return '';
  }

  // Data Emission
  private emitUnitsUpdate(): void {
    if (this.unitsForm.valid) {
      const formValue = this.unitsForm.value;
      this.unitsUpdated.emit(formValue.units);
    }
  }

  // Statistics
  getTotalLessons(): number {
    return this.unitsFormArray.value.reduce((total: number, unit: any) => {
      return total + (unit.lessons?.length || 0);
    }, 0);
  }

  getTotalDuration(): number {
    return this.unitsFormArray.value.reduce((total: number, unit: any) => {
      return total + (unit.lessons?.reduce((unitTotal: number, lesson: any) => {
        return unitTotal + (lesson.duration || 0);
      }, 0) || 0);
    }, 0);
  }

  getUnitDuration(unitIndex: number): number {
    const lessonsArray = this.getLessonsFormArray(unitIndex);
    return lessonsArray.value.reduce((total: number, lesson: any) => {
      return total + (lesson.duration || 0);
    }, 0);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    return `${minutes}د`;
  }

  // 🎯 UTILITY METHODS FOR BUTTON STATES
  canMoveUnitUp(index: number): boolean {
    return index > 0;
  }

  canMoveUnitDown(index: number): boolean {
    return index < this.unitsFormArray.length - 1;
  }

  canMoveLessonUp(unitIndex: number, lessonIndex: number): boolean {
    return lessonIndex > 0;
  }

  canMoveLessonDown(unitIndex: number, lessonIndex: number): boolean {
    const lessonsArray = this.getLessonsFormArray(unitIndex);
    return lessonIndex < lessonsArray.length - 1;
  }
}