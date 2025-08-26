import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from '../../../core/models/course-complete.model';

interface CourseType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  price: number;
  currency: string;
  buttonText: string;
  buttonAction: string;
  isDisabled: boolean;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-course-type-selection',
  templateUrl: './course-type-selection.component.html',
  styleUrls: ['./course-type-selection.component.scss']
})
export class CourseTypeSelectionComponent implements OnInit {
  courseId: string = '';
  course: Subject | null = null;

  courseTypes: CourseType[] = [
    {
      id: 'weekly-sessions',
      title: 'الحصص الأسبوعية',
      subtitle: 'اشتراك شهري',
      description: 'احضر حصص مباشرة أسبوعياً مع المدرس وتفاعل مع زملائك',
      features: [
        'حصص مباشرة أسبوعية',
        'تفاعل مباشر مع المدرس',
        'أسئلة وأجوبة فورية',
        'متابعة التقدم',
        'واجبات ومراجعات'
      ],
      price: 300,
      currency: 'جنيه',
      buttonText: 'اشترك الآن',
      buttonAction: 'subscribe',
      isDisabled: false,
      icon: 'fas fa-calendar-week',
      color: 'primary'
    },
    {
      id: 'recorded-course',
      title: 'الكورس المسجل',
      subtitle: 'مدفوع مرة واحدة',
      description: 'ادرس في أي وقت تريد مع مكتبة شاملة من الفيديوهات المسجلة',
      features: [
        'مكتبة شاملة من الفيديوهات',
        'إمكانية الدراسة في أي وقت',
        'تحميل المواد للدراسة بلا إنترنت',
        'اختبارات تفاعلية',
        'شهادة إتمام'
      ],
      price: 500,
      currency: 'جنيه',
      buttonText: 'ابدأ التعلم',
      buttonAction: 'start',
      isDisabled: false,
      icon: 'fas fa-play-circle',
      color: 'success'
    },
    {
      id: 'live-sessions',
      title: 'الحصص المباشرة',
      subtitle: 'قريباً',
      description: 'حصص مباشرة تفاعلية مع أحدث التقنيات التعليمية',
      features: [
        'حصص مباشرة تفاعلية',
        'تقنيات تعليمية متقدمة',
        'مجموعات دراسية صغيرة',
        'متابعة شخصية'
      ],
      price: 0,
      currency: 'جنيه',
      buttonText: 'قريباً',
      buttonAction: 'coming-soon',
      isDisabled: true,
      icon: 'fas fa-video',
      color: 'secondary'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.courseId = params['courseId'];
      if (this.courseId) {
        this.loadCourse();
      }
    });
  }

  loadCourse(): void {
    // Mock data - replace with actual service call
    this.course = {
      id: this.courseId,
      name: 'أساسيات الرياضيات',
      description: 'دورة شاملة في أساسيات الرياضيات تشمل الجبر والهندسة والإحصاء',
      imageUrl: 'assets/imgs/courses/math.jpg',
      isActive: true,
      order: 1,
      difficulty: 'beginner',
      duration: '40 ساعة',
      instructorName: 'د. أحمد محمد'
    };
  }

  selectCourseType(courseType: CourseType): void {
    if (courseType.isDisabled) {
      return;
    }

    switch (courseType.buttonAction) {
      case 'subscribe':
        this.router.navigate(['/student-dashboard/my-payments'], {
          queryParams: { 
            courseId: this.courseId,
            type: 'weekly-sessions',
            action: 'subscribe'
          }
        });
        break;
      case 'start':
        this.router.navigate(['/student-dashboard/course-details', this.courseId], {
          queryParams: { type: 'recorded' }
        });
        break;
      case 'coming-soon':
        // Handle coming soon action
        break;
    }
  }

  goBack(): void {
    this.router.navigate(['/student-dashboard/all-courses']);
  }
}