export interface Subject {
  id?: string;
  name: string;
  description: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration: string; // "3 months", "1 year", etc.
  imageUrl?: string;
  order: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;

 // Add missing properties for student dashboard
  instructorName?: string;
  instructorAvatar?: string;
  thumbnailUrl?: string;
  totalDuration?: number;
  studentsCount?: number;
  rating?: number;
  price?: number;
  
  // these computed/optional properties for UI
  status?: 'active' | 'inactive' | 'draft';
}

export interface Unit {
  id?: string;
  name: string;
  description: string;
  subjectId: string;
  order: number;
  lessons?: Lesson[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id?: string;
  name: string; // URL-friendly name like "intro-to-variables"
  title: string; // Display title
  description: string;
  lectureId: string; // This should match your Unit ID
  duration: number; // Duration in seconds
  lessonType: 'center_recorded' | 'studio_produced' | 'zoom' | 'document';
  sessionType: 'recorded' | 'live';
  academicYearId: string;
  studentYearId: string;
  isFree: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  isActive?: boolean;
  content?: LessonContent;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonContent {
  videoUrl?: string;
  documentUrl?: string;
  htmlContent?: string;
  attachments?: string[];
}

export interface CourseComplete {
  subject: Subject;
  units: Unit[];
  totalLessons: number;
  totalDuration: number; // in seconds
  status: 'draft' | 'published' | 'archived';
}

// Add interfaces for student dashboard
export interface CourseProgress {
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

export interface PaymentHistory {
  id: string;
  course: string;
  amount: number;
  currency: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  reference?: string;
}

export interface PaymentStats {
  lastPayments: number;
  pendingPayments: number;
}

export interface ProgressStats {
  totalCourses: number;
  completionRate: number;
  averageProgress: number;
  totalHoursStudied: number;
}

// Form state interfaces remain the same
export interface CourseFormState {
  currentStep: number;
  steps: FormStep[];
  isValid: boolean;
  isDirty: boolean;
}

export interface FormStep {
  id: number;
  title: string;
  isCompleted: boolean;
  isValid: boolean;
  hasErrors: boolean;
}

export interface Instructor {
  id: number;
  name: string;
  photo: string;
  specialization: string;
  experience: number;
  rating: number;
  bio?: string;
  department?: string;
}

export interface Course {
  id: number;
  image: string;
  instructor: string;  // Instructor
  instructorImg?: string; // Optional image for instructor
  subject: string; //Type Subject commented till db integration
  academicYear: string;
  rating: number;
  description?: string;
  duration?: string;
  studentsCount?: number;
}