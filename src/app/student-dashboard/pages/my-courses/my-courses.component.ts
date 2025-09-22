import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { MyContentService } from '../../../core/services/my-content.service';
import {
  AccessibleLesson,
  SubscribedSubject,
  MyContentFilters,
} from 'src/app/core/models/my-content.model';

@Component({
  selector: 'app-my-courses',
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.scss']
})
export class MyCoursesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  subjects: SubscribedSubject[] = [];
  lessons: AccessibleLesson[] = [];
  filteredLessons: AccessibleLesson[] = [];


  // UI State
  activeTab: 'overview' | 'subjects' | 'lessons' = 'overview';
  isLoading = false;
  isLoadingSubjects = false;
  isLoadingLessons = false;
  error: string | null = null;

  // Filters
  subjectFilter: string = 'all';
  lessonTypeFilter: 'all' | 'video' | 'document' | 'pdf' | 'text' | 'quiz' | 'assignment' | 'live' = 'all';
  difficultyFilter: 'all' | 'beginner' | 'intermediate' | 'advanced' = 'all';
  sortBy: 'recent' | 'name' | 'progress' | 'difficulty' = 'recent';
  searchQuery = '';

  // Lesson Types for UI
  lessonTypes = [
    { value: 'all', label: 'جميع الأنواع', icon: 'pi-list' },
    { value: 'video', label: 'فيديو', icon: 'pi-video' },
    { value: 'document', label: 'مستند', icon: 'pi-file' },
    { value: 'pdf', label: 'PDF', icon: 'pi-file-pdf' },
    { value: 'live', label: 'مباشر', icon: 'pi-users' },
    { value: 'quiz', label: 'اختبار', icon: 'pi-question-circle' },
    { value: 'assignment', label: 'تكليف', icon: 'pi-clipboard' }
  ];

  constructor(
    private router: Router,
    private myContentService: MyContentService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadAllData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      subjects: this.myContentService.getSubscribedSubjects().pipe(
        catchError(error => {
          console.error('Failed to load subjects:', error);
          return of([]);
        })
      ),
      lessons: this.myContentService.getAccessibleLessons().pipe(
        catchError(error => {
          console.error('Failed to load lessons:', error);
          return of([]);
        })
      ),
     
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ subjects, lessons }) => {
        this.subjects = subjects;
        this.lessons = lessons;
        this.filteredLessons = [...lessons];
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading content:', error);
        this.error = 'حدث خطأ أثناء تحميل المحتوى';
      }
    });
  }

  // Tab Management
  switchTab(tab: 'overview' | 'subjects' | 'lessons'): void {
    this.activeTab = tab;
    
    if (tab === 'lessons' && this.filteredLessons.length === 0) {
      this.loadLessons();
    }
  }

  // Data Loading Methods
  private loadLessons(filters?: MyContentFilters): void {
    this.isLoadingLessons = true;
    
    const finalFilters: MyContentFilters = {
      ...filters,
      subjectId: this.subjectFilter !== 'all' ? this.subjectFilter : undefined,
      lessonType: this.lessonTypeFilter !== 'all' ? this.lessonTypeFilter : undefined,
      difficulty: this.difficultyFilter !== 'all' ? this.difficultyFilter : undefined,
      search: this.searchQuery || undefined,
      sortBy: this.sortBy
    };

    this.myContentService.getAccessibleLessons(finalFilters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingLessons = false)
      )
      .subscribe({
        next: (lessons: AccessibleLesson[]) => {
          this.lessons = lessons;
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('Error loading lessons:', error);
          this.error = 'حدث خطأ أثناء تحميل الدروس';
        }
      });
  }

  // Filter Methods
  applyFilters(): void {
    let filtered = [...this.lessons];

    // Subject filter
    if (this.subjectFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.subjectId === this.subjectFilter);
    }

    // Lesson type filter
    if (this.lessonTypeFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.lessonType === this.lessonTypeFilter);
    }

    // Difficulty filter
    if (this.difficultyFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.difficulty === this.difficultyFilter);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        lesson.description.toLowerCase().includes(query) ||
        lesson.subjectName.toLowerCase().includes(query) ||
        lesson.unitName.toLowerCase().includes(query)
      );
    }

    // Sort
    this.sortLessons(filtered);
    
    this.filteredLessons = filtered;
  }

  private sortLessons(lessons: AccessibleLesson[]): void {
    lessons.sort((a, b) => {
      switch (this.sortBy) {
        case 'recent':
          const dateA = new Date(a.lastAccessedAt || a.createdAt).getTime();
          const dateB = new Date(b.lastAccessedAt || b.createdAt).getTime();
          return dateB - dateA;
        
        case 'name':
          return a.title.localeCompare(b.title, 'ar');
        
        case 'progress':
          return (b.progressPercentage || 0) - (a.progressPercentage || 0);
        
        case 'difficulty':
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        
        default:
          return 0;
      }
    });
  }

  // Filter Event Handlers
  onSubjectFilterChange(subjectId: string): void {
    this.subjectFilter = subjectId;
    this.applyFilters();
  }

  onLessonTypeFilterChange(type: any): void {
    this.lessonTypeFilter = type;
    this.applyFilters();
  }

  onDifficultyFilterChange(difficulty: any): void {
    this.difficultyFilter = difficulty;
    this.applyFilters();
  }

  onSortChange(sortBy: any): void {
    this.sortBy = sortBy;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.subjectFilter = 'all';
    this.lessonTypeFilter = 'all';
    this.difficultyFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'recent';
    this.applyFilters();
  }

  // Navigation Methods
  startLesson(lesson: AccessibleLesson): void {
    // Mark as accessed
    this.myContentService.markLessonAccessed(lesson.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    // Navigate to lesson
    this.router.navigate(['/student-dashboard/lesson-details', lesson.id], {
      queryParams: {
        course: lesson.subjectId,
        unitId: lesson.unitId
      }
    });
  }

  viewSubject(subject: SubscribedSubject): void {
    this.router.navigate(['/student-dashboard/course-details', subject.id]);
  }

  continueSubject(subject: SubscribedSubject): void {
    // Find next lesson to continue
    const subjectLessons = this.lessons.filter(l => l.subjectId === subject.id);
    const nextLesson = subjectLessons.find(l => !l.isCompleted) || subjectLessons[0];
    
    if (nextLesson) {
      this.startLesson(nextLesson);
    } else {
      this.viewSubject(subject);
    }
  }

  exploreMore(): void {
    this.router.navigate(['/student-dashboard/courses']);
  }

  // Utility Methods
  formatDuration(seconds: number): string {
    if (!seconds) return '0 د';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} س ${minutes} د`;
    }
    return `${minutes} د`;
  }

  formatStudyTime(seconds: number): string {
    if (!seconds) return '0 ساعة';
    
    const hours = Math.floor(seconds / 3600);
    if (hours < 24) {
      return `${hours} ساعة`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours === 0) {
      return `${days} يوم`;
    }
    
    return `${days} يوم ${remainingHours} ساعة`;
  }

  getDifficultyLabel(difficulty: string): string {
    const labels = {
      'beginner': 'مبتدئ',
      'intermediate': 'متوسط',
      'advanced': 'متقدم'
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  }

  getDifficultyColor(difficulty: string): string {
    const colors = {
      'beginner': 'success',
      'intermediate': 'warning',
      'advanced': 'danger'
    };
    return colors[difficulty as keyof typeof colors] || 'secondary';
  }

  getLessonTypeIcon(type: string): string {
    const icons = {
      'video': 'pi-video',
      'document': 'pi-file',
      'pdf': 'pi-file-pdf',
      'text': 'pi-file-text',
      'quiz': 'pi-question-circle',
      'assignment': 'pi-clipboard',
      'live': 'pi-users'
    };
    return icons[type as keyof typeof icons] || 'pi-circle';
  }

  getLessonTypeColor(type: string): string {
    const colors = {
      'video': 'primary',
      'document': 'info',
      'pdf': 'danger',
      'text': 'secondary',
      'quiz': 'warning',
      'assignment': 'success',
      'live': 'warning'
    };
    return colors[type as keyof typeof colors] || 'secondary';
  }

  getAccessMethodLabel(method: string): string {
    const labels = {
      'payment': 'مدفوع',
      'subscription': 'اشتراك',
      'activation_code': 'رمز التفعيل',
      'free': 'مجاني'
    };
    return labels[method as keyof typeof labels] || method;
  }

  getAccessMethodColor(method: string): string {
    const colors = {
      'payment': 'success',
      'subscription': 'primary',
      'activation_code': 'warning',
      'free': 'info'
    };
    return colors[method as keyof typeof colors] || 'secondary';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} شهر`;
    
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Getters for template
  get hasSubjects(): boolean {
    return this.subjects.length > 0;
  }

  get hasLessons(): boolean {
    return this.filteredLessons.length > 0;
  }

  get hasActiveFilters(): boolean {
    return this.subjectFilter !== 'all' ||
           this.lessonTypeFilter !== 'all' ||
           this.difficultyFilter !== 'all' ||
           this.searchQuery.trim() !== '';
  }

  

  // Add these methods to the existing component class

trackSubjectById(index: number, subject: SubscribedSubject): string {
  return subject.id;
}

trackLessonById(index: number, lesson: AccessibleLesson): string {
  return lesson.id;
}

getSessionTypeLabel(sessionType: string): string {
  const labels = {
    'center_recorded': 'مسجل - المركز',
    'studio': 'منتج - الاستوديو',
    'live': 'مباشر',
    'zoom': 'مباشر - Zoom',
    'recorded': 'مسجل'
  };
  return labels[sessionType as keyof typeof labels] || sessionType;
}

getLessonTypeLabel(type: string): string {
  const labels = {
    'video': 'فيديو',
    'document': 'مستند',
    'pdf': 'PDF',
    'text': 'نصي',
    'quiz': 'اختبار',
    'assignment': 'تكليف',
    'live': 'مباشر'
  };
  return labels[type as keyof typeof labels] || type;
}
}