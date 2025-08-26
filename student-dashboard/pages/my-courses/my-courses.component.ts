import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface CourseProgress {
  courseId: string;
  courseName: string;
  courseImage: string;
  instructor: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastAccessedDate: Date;
  status: 'active' | 'completed' | 'paused';
  enrollmentDate: Date;
  nextLesson?: {
    id: string;
    title: string;
    unit: string;
  };
}

interface ProgressStats {
  totalCourses: number;
  completionRate: number;
  averageProgress: number;
  totalHoursStudied: number;
}

@Component({
  selector: 'app-my-courses',
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.scss']
})
export class MyCoursesComponent implements OnInit {
  courses: CourseProgress[] = [];
  isLoading = false;
  
  stats: ProgressStats = {
    totalCourses: 3,
    completionRate: 67,
    averageProgress: 58,
    totalHoursStudied: 45
  };

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadMyCourses();
  }

  loadMyCourses(): void {
    this.isLoading = true;

    // Mock data - replace with actual service call
    setTimeout(() => {
      this.courses = [
        {
          courseId: '1',
          courseName: 'أساسيات الرياضيات',
          courseImage: 'assets/imgs/courses/math.jpg',
          instructor: 'د. أحمد محمد',
          totalLessons: 20,
          completedLessons: 17,
          progressPercentage: 85,
          lastAccessedDate: new Date(Date.now() - 86400000), // 1 day ago
          status: 'active',
          enrollmentDate: new Date(Date.now() - 30 * 86400000), // 30 days ago
          nextLesson: {
            id: '18',
            title: 'المعادلات التربيعية',
            unit: 'الوحدة الثالثة'
          }
        },
        {
          courseId: '2',
          courseName: 'فيزياء الميكانيكا',
          courseImage: 'assets/imgs/courses/physics.jpg',
          instructor: 'د. فاطمة علي',
          totalLessons: 15,
          completedLessons: 9,
          progressPercentage: 60,
          lastAccessedDate: new Date(Date.now() - 3 * 86400000), // 3 days ago
          status: 'active',
          enrollmentDate: new Date(Date.now() - 20 * 86400000), // 20 days ago
          nextLesson: {
            id: '10',
            title: 'قوانين نيوتن',
            unit: 'الوحدة الثانية'
          }
        },
        {
          courseId: '3',
          courseName: 'الكيمياء العضوية',
          courseImage: 'assets/imgs/courses/chemistry.jpg',
          instructor: 'د. محمد حسن',
          totalLessons: 25,
          completedLessons: 8,
          progressPercentage: 32,
          lastAccessedDate: new Date(Date.now() - 7 * 86400000), // 7 days ago
          status: 'paused',
          enrollmentDate: new Date(Date.now() - 15 * 86400000), // 15 days ago
          nextLesson: {
            id: '9',
            title: 'التفاعلات الكيميائية',
            unit: 'الوحدة الأولى'
          }
        }
      ];

      this.isLoading = false;
    }, 1000);
  }

  continueCourse(course: CourseProgress): void {
    if (course.nextLesson) {
      this.router.navigate(['/student-dashboard/lesson-details', course.nextLesson.id]);
    } else {
      this.router.navigate(['/student-dashboard/course-details', course.courseId]);
    }
  }

  viewCourseDetails(courseId: string): void {
    this.router.navigate(['/student-dashboard/course-details', courseId]);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'paused': return 'warning';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'paused': return 'متوقف مؤقتاً';
      default: return status;
    }
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'اليوم';
    if (days === 1) return 'أمس';
    if (days < 7) return `منذ ${days} أيام`;
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
    return `منذ ${Math.floor(days / 30)} شهر`;
  }

  sortCourses(criteria: 'progress' | 'recent' | 'name'): void {
    switch (criteria) {
      case 'progress':
        this.courses.sort((a, b) => b.progressPercentage - a.progressPercentage);
        break;
      case 'recent':
        this.courses.sort((a, b) => b.lastAccessedDate.getTime() - a.lastAccessedDate.getTime());
        break;
      case 'name':
        this.courses.sort((a, b) => a.courseName.localeCompare(b.courseName, 'ar'));
        break;
    }
  }
}