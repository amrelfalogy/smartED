// ✅ UPDATED: home.component.ts - Role-aware navigation using AuthService
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject as RxSubject, forkJoin } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { Subject as CourseSubject } from 'src/app/core/models/course-complete.model';
import { AcademicYear, StudentYear } from 'src/app/core/models/academic-year.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { AcademicYearService } from 'src/app/core/services/academic-year.service';
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

interface Instructor {
  id: number;
  name: string;
  photo: string;
  specialization: string;
  experience: number;
  rating: number;
  bio: string;
  department: string;
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

  isLoadingCourses = false;
  coursesError = '';

  steps = [
    { icon: 'pi-user-plus', title: 'إنشاء حساب', desc: 'سجّل مجانًا وفعّل بريدك الإلكتروني لبدء رحلتك التعليمية.' },
    { icon: 'pi-book', title: 'اختيار المواد', desc: 'تصفّح المواد بحسب المرحلة والسنة الدراسية.' },
    { icon: 'pi-credit-card', title: 'اختيار الخطة', desc: 'ادفع شهريًا، فصليًا، أو لكل درس حسب احتياجك.' },
    { icon: 'pi-play-circle', title: 'ابدأ التعلّم', desc: 'تابع الحصص المباشرة أو الدروس المسجلة وراقب تقدّمك.' }
  ];

  instructors: Instructor[] = [
    {
      id: 1,
      name: 'د. أحمد محمد الشريف',
      photo: 'https://lms.rocket-soft.org/store/934/A-Z%20Web%20Programming.jpg',
      specialization: 'علوم الحاسوب والذكاء الاصطناعي',
      experience: 8,
      rating: 5,
      bio: 'أستاذ مساعد ...',
      department: 'كلية الحاسوب والمعلومات',
      verified: true
    },
    {
      id: 2,
      name: 'د. فاطمة علي النجار',
      photo: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      specialization: 'الرياضيات التطبيقية',
      experience: 12,
      rating: 5,
      bio: 'أستاذ مشارك في قسم الرياضيات مع تخصص في التحليل العددي',
      department: 'كلية العلوم',
      verified: true
    },
    {
      id: 3,
      name: 'د. خالد حسن المطري',
      photo: 'https://lms.rocket-soft.org/store/934/A-Z%20Web%20Programming.jpg',
      specialization: 'الفيزياء النظرية',
      experience: 15,
      rating: 4,
      bio: 'أستاذ في قسم الفيزياء مع بحوث في فيزياء الجسيمات',
      department: 'كلية العلوم',
      verified: false
    },
    {
      id: 4,
      name: 'د. مريم الزهراني',
      photo: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      specialization: 'التاريخ الإسلامي والحضارة',
      experience: 10,
      rating: 5,
      bio: 'أستاذ مساعد في قسم التاريخ مع تخصص في الحضارة الإسلامية',
      department: 'كلية الآداب',
      verified: true
    }
  ];

  private destroy$ = new RxSubject<void>();

  constructor(
    private router: Router,
    private subjectService: SubjectService,
    private academicYearService: AcademicYearService,
    private authService: AuthService // ✅ Inject AuthService
  ) {}

  ngOnInit(): void {
    this.loadHomeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHomeData(): void {
    this.isLoadingCourses = true;
    this.coursesError = '';

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
      )
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ subjects, academicYears }) => {
        this.allSubjects = subjects || [];
        this.academicYears = academicYears || [];
        this.prepareCourses();
        this.isLoadingCourses = false;
      },
      error: (error) => {
        console.error('Error loading home data:', error);
        this.coursesError = 'حدث خطأ أثناء تحميل الدورات';
        this.isLoadingCourses = false;
      }
    });
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
      instructor: this.getInstructorName(subject),
      instructorImg: this.getInstructorImage(subject),
      academicYearName: this.getAcademicYearName(subject.academicYearId),
      studentYearName: this.getStudentYearName(subject.studentYearId),
      lessonType: this.determineLessonType(subject),
      price: this.generatePrice(subject),
      rating: this.generateRating(subject),
      image: subject.imageUrl || subject.thumbnail || 'assets/imgs/course-placeholder.jpg'
    }));
  }

  // ---------- Role-aware navigation using AuthService ----------
  viewCourse(course: HomeCourse): void {
    if (!course?.id) {
      console.error('Course ID is missing');
      return;
    }

    // Use AuthService’s normalized role helpers
    if (this.authService.canAccessAdmin()) {
      // Admin or support → admin course details route
      this.router.navigate(['/admin/course-details', course.id]);
      return;
    }

    if (this.authService.isStudent()) {
      // Student → student course details route
      this.router.navigate(['/student-dashboard/course-details', course.id]);
      return;
    }

    // Not logged in → go to login (optional: include a returnUrl)
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/courses` } });
  }

  // ---------- Helpers (unchanged below) ----------
  private getInstructorName(subject: CourseSubject): string {
    const instructorNames = ['أ. محمد علي', 'د. أحمد محمد', 'أ. فاطمة النجار', 'د. خالد المطري', 'أ. سارة أحمد', 'د. مريم الزهراني'];
    const hash = this.hashString(subject.name || '');
    return instructorNames[hash % instructorNames.length];
  }

  private getInstructorImage(subject: CourseSubject): string {
    const instructorImages = [
      'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      'https://lms.rocket-soft.org/store/934/A-Z%20Web%20Programming.jpg'
    ];
    const hash = this.hashString(subject.name || '');
    return instructorImages[hash % instructorImages.length];
  }

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

  private generateRating(subject: CourseSubject): number {
    const hash = this.hashString(subject.name || '');
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

  viewInstructor(instructor: any): void {
    this.router.navigate(['/instructors', instructor.id]);
  }

  reloadCourses(): void {
    this.loadHomeData();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/imgs/course-placeholder.jpg';
  }
}