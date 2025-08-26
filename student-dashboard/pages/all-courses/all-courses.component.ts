import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from '../../../core/models/course-complete.model';
import { SubjectService } from '../../../core/services/subject.service';

interface CourseFilter {
  search: string;
  subject: string;
  difficulty: string;
  instructor: string;
  progress: string;
}

@Component({
  selector: 'app-all-courses',
  templateUrl: './all-courses.component.html',
  styleUrls: ['./all-courses.component.scss']
})
export class AllCoursesComponent implements OnInit {
  courses: Subject[] = [];
  filteredCourses: Subject[] = [];
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';

  filter: CourseFilter = {
    search: '',
    subject: '',
    difficulty: '',
    instructor: '',
    progress: ''
  };

  subjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء'];
  difficulties = ['مبتدئ', 'متوسط', 'متقدم'];
  instructors = ['د. أحمد محمد', 'د. فاطمة علي', 'د. محمد حسن'];

  constructor(
    private subjectService: SubjectService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    // Mock data for now - replace with actual service call
    setTimeout(() => {
      this.courses = [
        {
          id: '1',
          name: 'أساسيات الرياضيات',
          description: 'دورة شاملة في أساسيات الرياضيات تشمل الجبر والهندسة والإحصاء. مناسبة للمبتدئين والطلاب الذين يرغبون في تقوية أساسياتهم في الرياضيات.',
          imageUrl: 'assets/imgs/courses/math.jpg',
          isActive: true,
          order: 1,
          difficulty: 'beginner',
          instructorName: 'د. أحمد محمد',
          duration: '40 ساعة',
          studentsCount: 150
        },
        {
          id: '2',
          name: 'فيزياء الميكانيكا',
          description: 'دراسة شاملة لقوانين الحركة والقوى في الفيزياء. تتضمن الحركة الخطية والدائرية والاهتزازات.',
          imageUrl: 'assets/imgs/courses/physics.jpg',
          isActive: true,
          order: 2,
          difficulty: 'intermediate',
          instructorName: 'د. فاطمة علي',
          duration: '35 ساعة',
          studentsCount: 120
        },
        {
          id: '3',
          name: 'الكيمياء العضوية',
          description: 'مقدمة شاملة في الكيمياء العضوية تشمل التركيب الجزيئي والتفاعلات الكيميائية.',
          imageUrl: 'assets/imgs/courses/chemistry.jpg',
          isActive: true,
          order: 3,
          difficulty: 'advanced',
          instructorName: 'د. محمد حسن',
          duration: '45 ساعة',
          studentsCount: 90
        }
      ];
      this.filteredCourses = [...this.courses];
      this.isLoading = false;
    }, 1000);
  }

  applyFilters(): void {
    this.filteredCourses = this.courses.filter(course => {
      const matchesSearch = !this.filter.search || 
        course.name.toLowerCase().includes(this.filter.search.toLowerCase()) ||
        course.description?.toLowerCase().includes(this.filter.search.toLowerCase());
      
      const matchesSubject = !this.filter.subject || course.name.includes(this.filter.subject);
      const matchesDifficulty = !this.filter.difficulty || this.getDifficultyLabel(course.difficulty) === this.filter.difficulty;
      const matchesInstructor = !this.filter.instructor || course.instructorName === this.filter.instructor;

      return matchesSearch && matchesSubject && matchesDifficulty && matchesInstructor;
    });
  }

  clearFilters(): void {
    this.filter = {
      search: '',
      subject: '',
      difficulty: '',
      instructor: '',
      progress: ''
    };
    this.filteredCourses = [...this.courses];
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  selectCourse(course: Subject): void {
    this.router.navigate(['/student-dashboard/course-type-selection'], {
      queryParams: { courseId: course.id }
    });
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

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }
}