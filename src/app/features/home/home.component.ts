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
  teachers: HomeTeacher[] = [];
  isLoadingTeachers = false;
  teachersError = '';

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
        this.prepareCourses();
        this.prepareTeachers(teachers.users || []); // ✅ NEW
        this.isLoadingCourses = false;
        this.isLoadingTeachers = false;
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
        rating: this.generateRating(teacher),
        verified: this.generateVerificationStatus(teacher)
      }))
      .slice(0, 8); // Show max 8 teachers

    console.log('✅ Teachers prepared for home:', this.teachers);
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
      .slice(0, 8);

    this.courses = publishedSubjects.map(subject => ({
      ...subject,
      academicYearName: this.getAcademicYearName(subject.academicYearId),
      studentYearName: this.getStudentYearName(subject.studentYearId),
      lessonType: this.determineLessonType(subject),
      price: this.generatePrice(subject),
      rating: this.generateRating(subject),
      image: subject.imageUrl || subject.thumbnail || 'assets/imgs/aboutt.jpg'
    }));
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
    // For now, just log - you can implement teacher profile page later
    console.log('View teacher profile:', teacher);
    // this.router.navigate(['/teachers', teacher.id]);
  }

  // ✅ Keep existing instructor navigation for demo cards
 

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

  private generatePrice(subject: CourseSubject): number {
    const hash = this.hashString(subject.name || '');
    const basePrices = [150, 180, 200, 220, 250, 280, 300];
    return basePrices[hash % basePrices.length];
  }

  private generateRating(subject: any): number {
    const hash = this.hashString((subject.name || subject.firstName || '') + (subject.lastName || ''));
    const ratings = [3, 4, 5];
    return ratings[hash % ratings.length];
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