import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject as RxSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Lesson, Unit, Subject as CourseSubject } from 'src/app/core/models/course-complete.model';

@Component({
  selector: 'app-units-section',
  templateUrl: './units-section.component.html',
  styleUrls: ['./units-section.component.scss']
})
export class UnitsSectionComponent implements OnInit, OnDestroy {
  @Input() units: Unit[] = [];
  @Input() subjectData!: CourseSubject;
  @Output() unitsUpdated = new EventEmitter<Unit[]>();

  unitsForm!: FormGroup;
  expandedUnit: number | null = 0;

  private destroy$ = new RxSubject<void>();
  private initialized = false;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initForm();
    this.patchUnits();
    this.subscribeChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get unitsFormArray(): FormArray {
    return this.unitsForm.get('units') as FormArray;
  }

  getLessonsFormArray(unitIndex: number): FormArray {
    return this.unitsFormArray.at(unitIndex).get('lessons') as FormArray;
  }

  private initForm(): void {
    this.unitsForm = this.fb.group({
      units: this.fb.array([])
    });
  }

  private patchUnits(): void {
    this.unitsFormArray.clear();
    if (this.units && this.units.length > 0) {
      this.units.forEach(u => this.unitsFormArray.push(this.buildUnitGroup(u)));
      this.initialized = true;
      this.emitUnitsDeferred();
    } else {
      Promise.resolve().then(() => {
        if (!this.initialized) {
          const unitGroup = this.buildUnitGroup();
          this.unitsFormArray.push(unitGroup);
          const lessonsFa = unitGroup.get('lessons') as FormArray;
          lessonsFa.push(this.buildLessonGroup({ order: 0 } as any));
          this.initialized = true;
          this.emitUnitsDeferred();
          this.cdr.detectChanges();
        }
      });
    }
  }

  private subscribeChanges(): void {
    this.unitsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.initialized) {
          this.emitUnitsDeferred();
        }
      });
  }

  private buildUnitGroup(unit?: Unit): FormGroup {
    return this.fb.group({
      id: [unit?.id],
      name: [unit?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [unit?.description || '', [Validators.required, Validators.minLength(10)]],
      subjectId: [unit?.subjectId || this.subjectData?.id || ''],
      order: [unit?.order ?? (this.unitsFormArray.length + 1)],
      lessons: this.fb.array(
        (unit?.lessons || []).map(l => this.buildLessonGroup(l))
      )
    });
  }

  private buildLessonGroup(lesson?: Lesson): FormGroup {
    return this.fb.group({
      id: [lesson?.id],
      unitId: [lesson?.unitId || lesson?.lectureId || ''],
      lectureId: [lesson?.lectureId || ''],
      title: [lesson?.title || '', [Validators.required, Validators.minLength(3)]],
      description: [lesson?.description || '', [Validators.required, Validators.minLength(10)]],
      order: [lesson?.order ?? 0],
      lessonType: [lesson?.lessonType || 'center_recorded', Validators.required],
      sessionType: [lesson?.sessionType || 'recorded', Validators.required],
      difficulty: [lesson?.difficulty || 'beginner', Validators.required],
      isFree: [lesson?.isFree ?? false],
      isActive: [lesson?.isActive ?? true],
      duration: [lesson?.duration ?? 0],
      videos: [lesson?.videos || []],
      documents: [lesson?.documents || []]
    });
  }

  addUnit(): void {
    const group = this.buildUnitGroup();
    this.unitsFormArray.push(group);
    const lessonsFa = group.get('lessons') as FormArray;
    lessonsFa.push(this.buildLessonGroup({ order: 0 } as any));
    this.expandedUnit = this.unitsFormArray.length - 1;
    this.recalculateUnitOrders();
    this.emitUnitsDeferred();
  }

  removeUnit(index: number): void {
    if (this.unitsFormArray.length <= 1) {
      alert('يجب أن تحتوي المادة على وحدة واحدة على الأقل');
      return;
    }
    if (!confirm('سيتم حذف الوحدة وجميع دروسها. هل أنت متأكد؟')) return;
    this.unitsFormArray.removeAt(index);
    if (this.expandedUnit === index) this.expandedUnit = null;
    this.recalculateUnitOrders();
    this.emitUnitsDeferred();
  }

  moveUnitUp(index: number): void {
    if (index <= 0) return;
    const ctrl = this.unitsFormArray.at(index);
    this.unitsFormArray.removeAt(index);
    this.unitsFormArray.insert(index - 1, ctrl);
    this.expandedUnit = index - 1;
    this.recalculateUnitOrders();
    this.emitUnitsDeferred();
  }

  moveUnitDown(index: number): void {
    if (index >= this.unitsFormArray.length - 1) return;
    const ctrl = this.unitsFormArray.at(index);
    this.unitsFormArray.removeAt(index);
    this.unitsFormArray.insert(index + 1, ctrl);
    this.expandedUnit = index + 1;
    this.recalculateUnitOrders();
    this.emitUnitsDeferred();
  }

  canMoveUnitUp(i: number): boolean { return i > 0; }
  canMoveUnitDown(i: number): boolean { return i < this.unitsFormArray.length - 1; }

  toggleUnitExpansion(i: number): void {
    this.expandedUnit = this.expandedUnit === i ? null : i;
  }

  addLesson(unitIndex: number): void {
    const fa = this.getLessonsFormArray(unitIndex);
    const parentUnitId = (this.unitsFormArray.at(unitIndex) as FormGroup).get('id')?.value || '';
    const newLesson = this.buildLessonGroup({ order: fa.length, unitId: parentUnitId } as any);
    fa.push(newLesson);
    this.recalculateLessonOrders(unitIndex);
    this.emitUnitsDeferred();
  }

  removeLesson(unitIndex: number, lessonIndex: number): void {
    const fa = this.getLessonsFormArray(unitIndex);
    if (fa.length <= 1) {
      alert('يجب أن تحتوي كل وحدة على درس واحد على الأقل');
      return;
    }
    if (!confirm('هل تريد حذف هذا الدرس؟')) return;
    fa.removeAt(lessonIndex);
    this.recalculateLessonOrders(unitIndex);
    this.emitUnitsDeferred();
  }

  onLessonUpdated(unitIndex: number, lessonIndex: number, updated: Lesson): void {
    const fa = this.getLessonsFormArray(unitIndex);
    const ctrl = fa.at(lessonIndex) as FormGroup;
    const parentUnitId = (this.unitsFormArray.at(unitIndex) as FormGroup).get('id')?.value || '';
    ctrl.patchValue({
      ...updated,
      unitId: updated.unitId || parentUnitId || updated.lectureId,
      videos: updated.videos || [],
      documents: updated.documents || []
    }, { emitEvent: false });
    this.emitUnitsDeferred();
  }

  private recalculateUnitOrders(): void {
    this.unitsFormArray.controls.forEach((ctrl, idx) => {
      ctrl.get('order')?.setValue(idx + 1, { emitEvent: false });
    });
  }

  private recalculateLessonOrders(unitIndex: number): void {
    const fa = this.getLessonsFormArray(unitIndex);
    fa.controls.forEach((ctrl, idx) => {
      ctrl.get('order')?.setValue(idx, { emitEvent: false });
    });
  }

  get isUnitFieldInvalid(): (i: number, field: string) => boolean {
    return (i: number, field: string) => {
      const ctrl = (this.unitsFormArray.at(i) as FormGroup).get(field);
      return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
    };
  }

  getFieldError(ctrl: any): string {
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'هذا الحقل مطلوب';
    if (ctrl.errors['minlength']) return `الحد الأدنى ${ctrl.errors['minlength'].requiredLength} حروف`;
    return 'قيمة غير صالحة';
  }

  getTotalLessons(): number {
    return this.unitsFormArray.controls.reduce((acc, u) => {
      const lessons = (u.get('lessons') as FormArray).length;
      return acc + lessons;
    }, 0);
  }

  getUnitDuration(unitIndex: number): number {
    const fa = this.getLessonsFormArray(unitIndex);
    return fa.controls.reduce((acc, l) => acc + (l.get('duration')?.value || 0), 0);
    }

  getTotalDuration(): number {
    return this.unitsFormArray.controls.reduce(
      (acc, u, idx) => acc + this.getUnitDuration(idx),
      0
    );
  }

  getUnitProgress(unitIndex: number): number | null {
    const fa = this.getLessonsFormArray(unitIndex);
    if (fa.length === 0) return null;
    let valid = 0;
    fa.controls.forEach(ctrl => {
      const title = ctrl.get('title')?.value?.trim();
      const desc = ctrl.get('description')?.value?.trim();
      const lt = ctrl.get('lessonType')?.value;
      const st = ctrl.get('sessionType')?.value;
      const diff = ctrl.get('difficulty')?.value;
      if (title && desc && lt && st && diff) valid++;
    });
    return Math.round((valid / fa.length) * 100);
  }

  getFormStatusMessage(): string {
    if (this.isFormValid) return 'جميع الوحدات والدروس مكتملة';
    if (this.unitsFormArray.length === 0) return 'أضف وحدة واحدة على الأقل';
    const emptyUnits = this.unitsFormArray.controls.filter(u => {
      const lessons = u.get('lessons') as FormArray;
      return lessons.length === 0;
    }).length;
    if (emptyUnits > 0) return `هناك ${emptyUnits} وحدة بلا دروس`;
    return 'يرجى استكمال بيانات بعض الدروس';
  }

  get isFormValid(): boolean {
    if (this.unitsFormArray.length === 0) return false;
    return this.unitsFormArray.controls.every(u => {
      const lessons = u.get('lessons') as FormArray;
      return u.valid &&
        lessons.length > 0 &&
        lessons.controls.every(l => {
          const title = l.get('title')?.value?.trim();
          const desc = l.get('description')?.value?.trim();
          const lt = l.get('lessonType')?.value;
          const st = l.get('sessionType')?.value;
          const diff = l.get('difficulty')?.value;
          return title && desc && lt && st && diff;
        });
    });
  }

  private emitUnitsDeferred(): void {
    const value: Unit[] = this.unitsFormArray.controls.map((unitCtrl) => {
      const uVal = unitCtrl.value as Unit;
      const ensuredLessons = (uVal.lessons || []).map((l: any) => ({
        ...l,
        unitId: l.unitId || uVal.id || l.lectureId,
        videos: Array.isArray(l.videos) ? l.videos : [],
        documents: Array.isArray(l.documents) ? l.documents : []
      }));
      return { ...uVal, lessons: ensuredLessons };
    });

    Promise.resolve().then(() => this.unitsUpdated.emit(value));
  }
  formatDuration(seconds: number): string {
    const h = Math.floor((seconds || 0) / 3600);
    const m = Math.floor(((seconds || 0) % 3600) / 60);
    if (h > 0) return `${h}س ${m}د`;
    return `${m}د`;
  }

  trackByUnit = (_: number, unitGroup: FormGroup) =>
    unitGroup.get('id')?.value || unitGroup.get('name')?.value || _;
  trackByLesson = (_: number, lessonGroup: FormGroup) =>
    lessonGroup.get('id')?.value || lessonGroup.get('title')?.value || _;
}