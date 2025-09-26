// ✅ UPDATED: home.component.ts - Add Teachers Loading
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject as RxSubject, forkJoin } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { Subject as CourseSubject } from 'src/app/core/models/course-complete.model';
import { User } from 'src/app/core/models/user.model'; // ✅ NEW
import { AcademicYear, StudentYear } from 'src/app/core/models/academic-year.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { AcademicYearService } from 'src/app/core/services/academic-year.service';
import { UserService } from 'src/app/core/services/user.service'; // ✅ NEW
import { AuthService } from 'src/app/core/services/auth.service';

// ✅ Enhanced Course interface for home display
interface HomeCourse extends CourseSubject {
  instructor?: string;
  instructorImg?: string;
  academicYearName?: string;
  studentYearName?: string;
  lessonType?: 'center_recorded' | 'studio_produced';
  price?: number;
  rating?: number;
}

// ✅ Enhanced Teacher interface 
interface HomeTeacher extends User {
  specialization?: string;
  yearsExperience?: number;
  rating?: number;
  verified?: boolean;
}



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  courses: HomeCourse[] = [];
  allSubjects: CourseSubject[] = [];
  academicYears: AcademicYear[] = [];
  studentYearsCache = new Map<string, StudentYear[]>();

  // ✅ NEW: Teachers data

  teachers: User[] = [];
  teacherMap = new Map<string, User>();

  isLoadingTeachers = false;
  teachersError = '';

  selectedTeacher: User | null = null;
  showTeacherProfileModal = false;


  isLoadingCourses = false;
  coursesError = '';

  steps = [
    { icon: 'pi-user-plus', title: 'إنشاء حساب', desc: 'سجّل مجانًا وفعّل بريدك الإلكتروني لبدء رحلتك التعليمية.' },
    { icon: 'pi-book', title: 'اختيار المواد', desc: 'تصفّح المواد بحسب المرحلة والسنة الدراسية.' },
    { icon: 'pi-credit-card', title: 'اختيار الخطة', desc: 'ادفع شهريًا، فصليًا، أو لكل درس حسب احتياجك.' },
    { icon: 'pi-play-circle', title: 'ابدأ التعلّم', desc: 'تابع الحصص المباشرة أو الدروس المسجلة وراقب تقدّمك.' }
  ];

  

  private destroy$ = new RxSubject<void>();

  constructor(
    private router: Router,
    private subjectService: SubjectService,
    private academicYearService: AcademicYearService,
    private userService: UserService, // ✅ NEW
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadHomeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ UPDATED: Load both courses and teachers
  private loadHomeData(): void {
    this.isLoadingCourses = true;
    this.isLoadingTeachers = true;
    this.coursesError = '';
    this.teachersError = '';

    forkJoin({
      subjects: this.subjectService.getAllSubjects().pipe(
        catchError(err => {
          console.error('Error loading subjects for home:', err);
          return of([]);
        })
      ),
      academicYears: this.academicYearService.getAcademicYears().pipe(
        catchError(err => {
          console.error('Error loading academic years for home:', err);
          return of([]);
        })
      ),
      teachers: this.userService.getTeachers({ limit: 12 }).pipe( // ✅ NEW
        catchError(err => {
          console.error('Error loading teachers for home:', err);
          return of({ users: [], pagination: { current: 1, total: 1, totalItems: 0 } });
        })
      )
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ subjects, academicYears, teachers }) => {
        this.allSubjects = subjects || [];
        this.academicYears = academicYears || [];
        this.prepareTeachers(teachers.users || []); // ✅ NEW
        this.isLoadingCourses = false;
        this.isLoadingTeachers = false;
        
        this.loadStudentYearsForAllAcademicYears(() => {
          this.prepareCourses();
        });

      },
      error: (error) => {
        console.error('Error loading home data:', error);
        this.coursesError = 'حدث خطأ أثناء تحميل الدورات';
        this.teachersError = 'حدث خطأ أثناء تحميل بيانات المعلمين';
        this.isLoadingCourses = false;
        this.isLoadingTeachers = false;
      }
    });
  }

  private loadStudentYearsForAllAcademicYears(onComplete?: () => void): void {
    if (!this.academicYears || this.academicYears.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    let loadedCount = 0;
    const total = this.academicYears.length;
    this.academicYears.forEach(ay => {
      this.academicYearService.getStudentYears(ay.id).subscribe({
        next: (studentYears: StudentYear[]) => {
          this.studentYearsCache.set(ay.id, studentYears);
          loadedCount++;
          if (loadedCount === total && onComplete) onComplete();
        },
        error: (err) => {
          console.error('Error loading student years for academic year', ay.id, err);
          loadedCount++;
          if (loadedCount === total && onComplete) onComplete();
        }
      });
    });
  }

  // ✅ NEW: Prepare teachers data
  private prepareTeachers(teachersData: User[]): void {
    if (!teachersData || teachersData.length === 0) {
      this.teachersError = 'لا يوجد معلمين متاحين حالياً';
      return;
    }

    this.teachers = teachersData
      .filter(teacher => teacher.isActive)
      .map(teacher => ({
        ...teacher,
        specialization: this.generateSpecialization(teacher),
        yearsExperience: this.generateExperience(teacher),
        verified: this.generateVerificationStatus(teacher)
      }))
      .slice(0, 5); // Show max 5 teachers

    this.teacherMap.clear();
    this.teachers.forEach(t => this.teacherMap.set(t.id, t));  
  }
  getTeacherProfileImage(teacher: HomeTeacher): string {
    return this.userService.getProfileImageUrl(teacher);
  }

  private prepareCourses(): void {
  const publishedSubjects = this.allSubjects
    .filter(subject => subject.status === 'published')
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  this.courses = publishedSubjects.map(subject => {
    const teacher = this.teacherMap.get(subject.teacherId || '');
    const instructorName = teacher
      ? [teacher.firstName, teacher.lastName].filter(Boolean).join(' ')
      : 'غير محدد';

    return {
      ...subject,
      academicYearName: this.getAcademicYearName(subject.academicYearId),
      studentYearName: this.getStudentYearName(subject.studentYearId),
      lessonType: this.determineLessonType(subject),
      price: subject.price ?? 0, // ✅ Use subject.price directly
      image: subject.imageUrl || subject.thumbnail || 'assets/imgs/aboutt.jpg',
      instructor: instructorName
    };
  });
}



  getTeacherNameById(teacherId?: string): string {
    if (!teacherId) return 'غير محدد';
    const teacher = this.teacherMap.get(teacherId);
    if (!teacher) return 'غير محدد';
    const fullName = [teacher.firstName, teacher.lastName].filter(Boolean).join(' ');
    return fullName || teacher.email || 'غير محدد';
  }

  // ✅ NEW: Teacher data generators
  private generateSpecialization(teacher: User): string {
    const specializations = [
      'الرياضيات المتقدمة',
      'الفيزياء التطبيقية',
      'علوم الحاسوب',
      'الكيمياء العضوية',
      'اللغة العربية والأدب',
      'التاريخ الإسلامي',
      'علم النفس التربوي',
      'الاقتصاد والإدارة'
    ];
    const hash = this.hashString(teacher.firstName + teacher.lastName);
    return specializations[hash % specializations.length];
  }

  private generateExperience(teacher: User): number {
    const hash = this.hashString(teacher.email || '');
    return (hash % 15) + 5; // 5-20 years experience
  }

  private generateVerificationStatus(teacher: User): boolean {
    const hash = this.hashString(teacher.id);
    return hash % 3 !== 0; // ~66% verified
  }

  // ✅ UPDATED: Role-aware navigation
  viewCourse(course: HomeCourse): void {
    if (!course?.id) {
      console.error('Course ID is missing');
      return;
    }

    if (this.authService.canAccessAdmin()) {
      this.router.navigate(['/admin/course-details', course.id]);
      return;
    }

    if (this.authService.isStudent()) {
      this.router.navigate(['/student-dashboard/course-details', course.id]);
      return;
    }

    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/courses` } });
  }

  // ✅ NEW: View teacher profile
  viewTeacher(teacher: HomeTeacher): void {
    this.selectedTeacher = teacher;
    this.showTeacherProfileModal = true;
  }
    closeProfileModal(): void {
    this.showTeacherProfileModal = false;
    this.selectedTeacher = null;
  }

  onUserUpdated(updatedUser: User): void {
    const index = this.teachers.findIndex(t => t.id === updatedUser.id);
    if (index !== -1) {
      this.teachers[index] = updatedUser;
    }
    this.closeProfileModal();
  }

  onUserDeleted(userId: string): void {
    this.teachers = this.teachers.filter(t => t.id !== userId);
    this.closeProfileModal();
  }
 

  // ✅ NEW: Retry teachers loading
  retryLoadTeachers(): void {
    this.loadHomeData();
  }

  reloadCourses(): void {
    this.loadHomeData();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/imgs/aboutt.jpg';
  }

  // ✅ Helper methods (unchanged)
 

 

  private getAcademicYearName(academicYearId?: string): string {
    if (!academicYearId) return 'غير محدد';
    const academicYear = this.academicYears.find(ay => ay.id === academicYearId);
    return academicYear?.displayName || academicYear?.name || 'غير محدد';
  }

  private getStudentYearName(studentYearId?: string): string {
    if (!studentYearId) return '';
    for (const [, studentYears] of this.studentYearsCache) {
      const found = studentYears.find(sy => sy.id === studentYearId);
      if (found) return found.displayName || found.name || '';
    }
    return '';
  }

  private determineLessonType(subject: CourseSubject): 'center_recorded' | 'studio_produced' {
    const hash = this.hashString(subject.name || '');
    return hash % 2 === 0 ? 'center_recorded' : 'studio_produced';
  }

 

 
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}