import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Unit, Lesson } from 'src/app/core/models/course-complete.model';

@Component({
  selector: 'app-course-details',
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss']
})
export class CourseDetailsComponent implements OnInit {
  courseId: string = '';
  course: Subject | null = null;
  units: Unit[] = [];
  lesson: Lesson[] = [];
  isLoading = false;
  enrollmentStatus = 'not_enrolled'; // 'enrolled', 'not_enrolled', 'pending'

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = params['id'];
      if (this.courseId) {
        this.loadCourseDetails();
      }
    });
  }

  loadCourseDetails(): void {
    this.isLoading = true;
    
    // Mock data - replace with actual service calls
    setTimeout(() => {
      this.course = {
        id: this.courseId,
        name: 'أساسيات الرياضيات',
        description: 'دورة شاملة في أساسيات الرياضيات تشمل الجبر والهندسة والإحصاء. مناسبة للمبتدئين والطلاب الذين يرغبون في تقوية أساسياتهم في الرياضيات.',
        imageUrl: 'assets/imgs/about.jpg',
        isActive: true,
        order: 1,
        difficulty: 'beginner',
        duration: '40 ساعة',
        instructorName: 'د. أحمد محمد'
      };

      this.units = [
        {
          id: '1',
          name: 'الوحدة الأولى: مقدمة في الرياضيات',
          description: 'مقدمة عامة في الرياضيات والأرقام والعمليات الأساسية',
          subjectId: this.courseId,
          order: 1,
          isActive: true,
          lessons: [
            {
              id: '1',
              name: 'intro-to-math',
              title: 'مقدمة في الرياضيات',
              description: 'تعريف بعلم الرياضيات وأهميته في الحياة اليومية',
              lectureId: '1',
              duration: 1200, // 20 minutes
              lessonType: 'center_recorded',
              sessionType: 'recorded',
              academicYearId: '1',
              studentYearId: '1',
              isFree: true,
              difficulty: 'beginner',
              order: 1,
              isActive: true
            },
            {
              id: '2',
              name: 'numbers-system',
              title: 'أنظمة الأرقام',
              description: 'دراسة الأرقام الطبيعية والصحيحة والنسبية',
              lectureId: '1',
              duration: 1800, // 30 minutes
              lessonType: 'center_recorded',
              sessionType: 'recorded',
              academicYearId: '1',
              studentYearId: '1',
              isFree: false,
              difficulty: 'beginner',
              order: 2,
              isActive: true
            }
          ]
        },
        {
          id: '2',
          name: 'الوحدة الثانية: الجبر الأساسي',
          description: 'دراسة المتغيرات والمعادلات البسيطة',
          subjectId: this.courseId,
          order: 2,
          isActive: true,
          lessons: [
            {
              id: '3',
              name: 'variables-intro',
              title: 'مقدمة في المتغيرات',
              description: 'فهم مفهوم المتغيرات والثوابت في الرياضيات',
              lectureId: '2',
              duration: 1500, // 25 minutes
              lessonType: 'center_recorded',
              sessionType: 'recorded',
              academicYearId: '1',
              studentYearId: '1',
              isFree: false,
              difficulty: 'beginner',
              order: 1,
              isActive: true
            },
            {
              id: '4',
              name: 'simple-equations',
              title: 'المعادلات البسيطة',
              description: 'حل المعادلات الخطية البسيطة',
              lectureId: '2',
              duration: 2100, // 35 minutes
              lessonType: 'center_recorded',
              sessionType: 'recorded',
              academicYearId: '1',
              studentYearId: '1',
              isFree: false,
              difficulty: 'intermediate',
              order: 2,
              isActive: true
            }
          ]
        }
      ];

      this.isLoading = false;
    }, 1000);
  }

  startLesson(lesson: Lesson): void {
    if (!lesson.isFree && this.enrollmentStatus !== 'enrolled') {
      this.showPaymentRequired();
      return;
    }

    this.router.navigate(['/student-dashboard/lesson-details', lesson.id]);
  }

  showPaymentRequired(): void {
    // Show payment modal or redirect to payment page
    this.router.navigate(['/student-dashboard/my-payments'], {
      queryParams: { 
        courseId: this.courseId,
        action: 'enroll'
      }
    });
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} دقيقة`;
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

  goBack(): void {
    this.router.navigate(['/student-dashboard/all-courses']);
  }

  getTotalLessons(): number {
    return this.units.reduce((total, unit) => total + (unit.lessons?.length || 0), 0);
  }
}