export interface Subject {
  id?: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  imageUrl: string;
  image?: string | null;        // ✅ Add backend field
  thumbnail?: string | null;    // ✅ Add backend field
  status?: 'draft' | 'published'; // ✅ Add status tracking
  isActive?: boolean;           // ✅ Add active status
  academicYearId?: string;  // ✅ Add this
  studentYearId?: string;   // ✅ Add this

  order: number;
  createdAt?: string;           // ✅ Add timestamps
  updatedAt?: string; 

 // Add missing properties for student dashboard
  instructorName?: string;
  instructorAvatar?: string;
  thumbnailUrl?: string;
  totalDuration?: number;
  studentsCount?: number;
  rating?: number;
  price?: number;
  
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
  hasAccess?: boolean; // ✅ NEW: Access status
  requiresPayment?: boolean; // ✅ NEW: Payment requirement
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonContent {
  videoUrl?: string;
  documentUrl?: string;
  htmlContent?: string;
  attachments?: string[];
}

// ✅ NEW: Payment Plan Interface
export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  duration: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  order: number;
  discountPercentage: string;
  type?: string; // monthly, semester, annual
  lessonType?: string; // center_recorded, studio_produced
  createdAt: string;
  updatedAt: string;
}

// ✅ NEW: Payment Plans Response
export interface PaymentPlansResponse {
  plans: PaymentPlan[];
}

// ✅ NEW: Lesson Access Response
export interface LessonAccess {
  hasAccess: boolean;
  requiresPayment: boolean;
  message?: string;
  planRequired?: string;
}

// ✅ NEW: Create Payment Plan Request
export interface CreatePaymentPlanRequest {
  name: string;
  description: string;
  type: string;
  lessonType: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
}

// ✅ NEW: Lesson Type Card
export interface LessonTypeCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessonType: 'center_recorded' | 'studio_produced' | 'zoom';
  isAvailable: boolean;
  isSelected: boolean;
  color: string;
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