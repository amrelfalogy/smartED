export interface Subject {
  id?: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string; // "3 months", "1 year", etc.
  imageUrl?: string;
  order: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // these computed/optional properties for UI
  status?: 'active' | 'inactive' | 'draft';
  studentsCount?: number;
  instructorName?: string;
  instructorAvatar?: string;
  thumbnailUrl?: string;
  totalDuration?: number;
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