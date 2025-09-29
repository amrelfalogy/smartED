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
      content: [lesson?.content || ''],
      order: [lesson?.order ?? 0],
      lessonType: [lesson?.lessonType || 'video', Validators.required], // ✅ Consistent default
      price: [lesson?.price ?? 0, [Validators.min(0)]],
      videoUrl: [lesson?.videoUrl || null], // ✅ Single value
      documentFile: [null], // ✅ Single value
      pdfUrl: [lesson?.pdfUrl || null], // ✅ Single value
      pdfFileName: [lesson?.pdfFileName ?? null],
      pdfFileSize: [lesson?.pdfFileSize ?? null],
      difficulty: [lesson?.difficulty || 'beginner', Validators.required],
      isFree: [lesson?.isFree ?? false],
      isActive: [lesson?.isActive ?? true],
      duration: [lesson?.duration ?? 0],
      thumbnail: [lesson?.thumbnail ?? null],
      academicYearId: [lesson?.academicYearId ?? null],
      studentYearId: [lesson?.studentYearId ?? null],
      zoomUrl: [lesson?.zoomUrl ?? null],
      zoomMeetingId: [lesson?.zoomMeetingId ?? null],
      zoomPasscode: [lesson?.zoomPasscode ?? null],
      scheduledAt: [lesson?.scheduledAt ?? null]    
    });
  }

  
  getLessonGroup(unitIndex: number, lessonIndex: number): FormGroup {
    const lessonsArray = this.getLessonsFormArray(unitIndex);
    return lessonsArray.at(lessonIndex) as FormGroup;
  }

  // Update the onDocumentSelected method to use correct parameters
  onDocumentSelected(event: Event, unitIndex: number, lessonIndex: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.includes('pdf')) {
      console.error('Only PDF files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.error('File size must be less than 10MB');
      return;
    }

    const lessonGroup = this.getLessonGroup(unitIndex, lessonIndex);
    lessonGroup.patchValue({
      documentFile: file,
      pdfFileName: file.name,
      pdfFileSize: file.size
    });

    console.log('✅ Document file selected:', file.name);
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

 // ✅ Update the onLessonUpdated method to handle file properly
onLessonUpdated(unitIndex: number, lessonIndex: number, updated: Lesson): void {
  const fa = this.getLessonsFormArray(unitIndex);
  const ctrl = fa.at(lessonIndex) as FormGroup;
  const parentUnitId = (this.unitsFormArray.at(unitIndex) as FormGroup).get('id')?.value || '';
  
  console.log('🔄 Updating lesson in units section:', {
    unitIndex,
    lessonIndex,
    lessonId: updated.id,
    title: updated.title,
    hasDocumentFile: !!(updated as any).documentFile,
    documentFileName: (updated as any).documentFile?.name,
    pdfUrl: updated.pdfUrl
  });
  
  // ✅ Update the form control with ALL the data including file
  ctrl.patchValue({
    ...updated,
    unitId: updated.unitId || parentUnitId || updated.lectureId,
    videoUrl: updated.videoUrl || null,
    document: updated.document || null,
    documentFile: (updated as any).documentFile || null, // ✅ Critical: Keep the file
    pdfUrl: updated.pdfUrl || null,
    pdfFileName: updated.pdfFileName || null,
    pdfFileSize: updated.pdfFileSize || null
  }, { emitEvent: false });
  
  this.emitUnitsDeferred();
}

// ✅ Update the emitUnitsDeferred method to preserve documentFile
  private emitUnitsDeferred(): void {
    const value: Unit[] = this.unitsFormArray.controls.map((unitCtrl) => {
      const uVal = unitCtrl.value as Unit;
      
      const ensuredLessons = (uVal.lessons || []).map((l: any) => ({
        id: l.id,
        unitId: l.unitId || uVal.id || l.lectureId,
        title: l.title,
        description: l.description,
        content: l.content,
        order: l.order,
        lessonType: l.lessonType,
        price: l.isFree ? 0 : l.price,
        videoUrl: l.videoUrl || null,
        document: l.document || null,
        documentFile: l.documentFile || null, // ✅ Critical: Preserve the file object
        pdfUrl: l.pdfUrl || null,
        pdfFileName: l.pdfFileName || null,
        pdfFileSize: l.pdfFileSize || null,
        difficulty: l.difficulty,
        isFree: l.isFree,
        isActive: l.isActive,
        duration: l.duration,
        thumbnail: l.thumbnail,
        academicYearId: l.academicYearId,
        studentYearId: l.studentYearId,
        zoomUrl: l.zoomUrl,
        zoomMeetingId: l.zoomMeetingId,
        zoomPasscode: l.zoomPasscode,
        scheduledAt: l.scheduledAt,
      }));
      
      return { ...uVal, lessons: ensuredLessons };
    });
    
    Promise.resolve().then(() => this.unitsUpdated.emit(value));
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

  // ✅ FIX: Update the isFormValid getter to match actual form structure
  get isFormValid(): boolean {
    if (this.unitsFormArray.length === 0) return false;
    
    return this.unitsFormArray.controls.every(u => {
      const lessons = u.get('lessons') as FormArray;
      const unitValid = u.valid;
      const hasLessons = lessons.length > 0;
      
      const allLessonsValid = lessons.controls.every(l => {
        const lessonGroup = l as FormGroup;
        const title = lessonGroup.get('title')?.value?.trim();
        const desc = lessonGroup.get('description')?.value?.trim();
        const lessonType = lessonGroup.get('lessonType')?.value;
        const difficulty = lessonGroup.get('difficulty')?.value;
        
        // ✅ Basic validation
        const basicValid = !!(title && desc && lessonType && difficulty);
        
        // ✅ Content validation based on lesson type
        let contentValid = true;
        if (lessonType === 'video') {
          const videoUrl = lessonGroup.get('videoUrl')?.value;
          contentValid = !!videoUrl;
        } else if (lessonType === 'pdf' || lessonType === 'document') {
          const document = lessonGroup.get('document')?.value;
          const documentFile = lessonGroup.get('documentFile')?.value;
          const pdfUrl = lessonGroup.get('pdfUrl')?.value; 
          contentValid = !!(document || documentFile || pdfUrl); 
        }
        
        // ✅ Price validation
        const isFree = lessonGroup.get('isFree')?.value;
        const price = lessonGroup.get('price')?.value;
        const priceValid = isFree || (!isFree && price >= 0);
        
        return basicValid && contentValid && priceValid;
      });
      
      return unitValid && hasLessons && allLessonsValid;
    });
  }

  // ✅ FIX: Update status message to be more specific
  getFormStatusMessage(): string {
    if (this.isFormValid) return 'جميع الوحدات والدروس مكتملة';
    if (this.unitsFormArray.length === 0) return 'أضف وحدة واحدة على الأقل';
    
    // ✅ Check for specific issues
    const emptyUnits = this.unitsFormArray.controls.filter(u => {
      const lessons = u.get('lessons') as FormArray;
      return lessons.length === 0;
    });
    
    if (emptyUnits.length > 0) return `هناك ${emptyUnits.length} وحدة بلا دروس`;
    
    // ✅ Check for invalid lessons
    const invalidLessons: string[] = [];
    this.unitsFormArray.controls.forEach((u, unitIndex) => {
      const unitName = u.get('name')?.value || `الوحدة ${unitIndex + 1}`;
      const lessons = u.get('lessons') as FormArray;
      
      lessons.controls.forEach((l, lessonIndex) => {
        const lessonGroup = l as FormGroup;
        const lessonTitle = lessonGroup.get('title')?.value || `الدرس ${lessonIndex + 1}`;
        const lessonType = lessonGroup.get('lessonType')?.value;
        
        // Check what's missing
        const issues: string[] = [];
        if (!lessonGroup.get('title')?.value?.trim()) issues.push('العنوان');
        if (!lessonGroup.get('description')?.value?.trim()) issues.push('الوصف');
        if (!lessonType) issues.push('نوع المحتوى');
        if (!lessonGroup.get('difficulty')?.value) issues.push('المستوى');
        
        if (lessonType === 'video' && !lessonGroup.get('videoUrl')?.value) {
          issues.push('رابط الفيديو');
        }
        if ((lessonType === 'pdf' || lessonType === 'document') && 
            !lessonGroup.get('document')?.value && 
            !lessonGroup.get('documentFile')?.value) { // ✅ Check both
          issues.push('ملف المستند');
        }
        
        const isFree = lessonGroup.get('isFree')?.value;
        const price = lessonGroup.get('price')?.value;
        if (!isFree && (!price || price < 0)) {
          issues.push('السعر');
        }
        
        if (issues.length > 0) {
          invalidLessons.push(`${unitName} - ${lessonTitle}: ${issues.join(', ')}`);
        }
      });
    });
    
    if (invalidLessons.length > 0) {
      return `يرجى إكمال البيانات التالية:\n${invalidLessons.slice(0, 3).join('\n')}${invalidLessons.length > 3 ? '\n...' : ''}`;
    }
    
    return 'يرجى استكمال بيانات بعض الدروس';
  }


  formatDuration(seconds: number): string {
    const h = Math.floor((seconds || 0) / 3600);
    const m = Math.floor(((seconds || 0) % 3600) / 60);
    if (h > 0) return `${h}س ${m}د`;
    return `${m}د`;
  }
}