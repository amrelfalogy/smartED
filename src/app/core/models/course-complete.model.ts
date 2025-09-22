export interface Subject {
  id?: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  imageUrl: string;
  order: number;

  academicYearId?: string;
  studentYearId?: string;
  status?: 'draft' | 'published';
  isActive?: boolean;
  image?: string | null;
  thumbnail?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Optional enrichment fields for UI
  instructorName?: string;
  instructorAvatar?: string;
  thumbnailUrl?: string;
  totalDuration?: number;
  studentsCount?: number;
  rating?: number;

  // Commerce
  price?: number | null;
  // Delivery/session is now at the subject level
  sessionType?:
    | 'recorded'
    | 'center_recorded'
    | 'studio'
    | 'live'
    | 'zoom'
    | 'teams'
    | 'webinar';

  // Backend teacher relation
  teacherId?: string;
}

export interface Unit {
  id?: string;
  name: string;
  description: string;
  subjectId: string;
  order: number;
  lessons?: Lesson[];
  isActive?: boolean;
  status?: 'draft' | 'published' | 'deleted';
  thumbnail?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id?: string;
  title: string;
  description: string;

  unitId?: string;
  lectureId?: string; // legacy

  duration?: number; // seconds

  // Content format (delivery removed from lesson)
  lessonType?:
    | 'video'
    | 'text'
    | 'quiz'
    | 'assignment'
    | 'live'
    | 'document'
    | 'pdf';

  // Delivery/session REMOVED from lesson (moved to Subject)
  // sessionType?: never;

  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  order: number;

  academicYearId?: string | null;
  studentYearId?: string | null;

  isFree?: boolean;
  isActive?: boolean;
  status?: 'draft' | 'published' | 'deleted';
  thumbnail?: string | null;

  // Backend fields
  content?: string | null;
  price?: number | null;
  currency?: 'EGP' | string | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  pdfFileName?: string | null;
  pdfFileSize?: number | null;

  // Live session
  zoomUrl?: string | null;
  zoomMeetingId?: string | null;
  zoomPasscode?: string | null;
  scheduledAt?: string | null;

  // Access
  hasAccess?: boolean;
  requiresPayment?: boolean;
  accessReason?: string | null;

  createdAt?: string;
  updatedAt?: string;

  // Optional legacy arrays
  videos?: string[];
  documents?: string[];
}

export interface CourseComplete {
  subject: Subject;
  units: Unit[];
  totalLessons: number;
  totalDuration: number;
  status: 'draft' | 'published' | 'archived';
}

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

// Keep these for other pages (fixes ProgressStats import error)
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

export interface ProgressStats {
  totalCourses: number;
  completionRate: number;
  averageProgress: number;
  totalHoursStudied: number;
}