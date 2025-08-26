import { Component, OnInit } from '@angular/core';

interface DashboardStats {
  enrolledCourses: number;
  completedLessons: number;
  pendingPayments: number;
  totalProgress: number;
}

interface RecentActivity {
  id: string;
  type: 'lesson' | 'payment' | 'course';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  stats: DashboardStats = {
    enrolledCourses: 5,
    completedLessons: 23,
    pendingPayments: 2,
    totalProgress: 67
  };

  recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'lesson',
      title: 'تم إكمال الدرس',
      description: 'مقدمة في الجبر الخطي - الرياضيات',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      icon: 'fas fa-check-circle',
      color: 'success'
    },
    {
      id: '2',
      type: 'payment',
      title: 'تم تأكيد الدفع',
      description: 'اشتراك الفصل الدراسي - الفيزياء',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      icon: 'fas fa-credit-card',
      color: 'primary'
    },
    {
      id: '3',
      type: 'course',
      title: 'تم تسجيلك في دورة جديدة',
      description: 'أساسيات الكيمياء العضوية',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      icon: 'fas fa-graduation-cap',
      color: 'info'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // TODO: Load actual data from service
    console.log('Loading dashboard data...');
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    if (minutes > 0) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    return 'الآن';
  }

  navigateToAllCourses(): void {
    // TODO: Navigate to all courses page
    console.log('Navigate to all courses');
  }

  navigateToMyCourses(): void {
    // TODO: Navigate to my courses page
    console.log('Navigate to my courses');
  }

  navigateToPayments(): void {
    // TODO: Navigate to payments page
    console.log('Navigate to payments');
  }
}