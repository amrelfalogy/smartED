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
  status?: 'draft' | 'published';
  thumbnail?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonContent {
  videoUrl?: string;
  documentUrl?: string;
  htmlContent?: string;
  attachments?: string[];
}

export interface Lesson {
  id?: string;
  title: string;
  description: string;

  // Backend uses unitId now (lectureId kept for backward compatibility when loading legacy data)
  unitId?: string;
  lectureId?: string;

  duration?: number; // seconds
  lessonType?: 'center_recorded' | 'studio_produced' | 'zoom' | 'document';
  sessionType?: 'recorded' | 'live';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  order: number;

  academicYearId?: string | null;
  studentYearId?: string | null;

  isFree?: boolean;
  isActive?: boolean;
  status?: 'draft' | 'published';
  thumbnail?: string | null;

  videos?: string[];     // required: at least one for non-document lessons
  documents?: string[];
  
  hasAccess?: boolean;
  requiresPayment?: boolean;
  
  createdAt?: string;
  updatedAt?: string;
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

// Payment & Plans (unchanged)
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

export type PlanType = 'lesson' | 'monthly' | 'semester';
export type LessonType = 'center_recorded' | 'studio_produced' | 'zoom' | 'document';
export type PaymentMethod = 'vodafone_cash' | 'instapay';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'EGP';
  duration: number; // days
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  order: number;
  discountPercentage: string;
  type: PlanType;
  lessonType?: Extract<LessonType, 'center_recorded' | 'studio_produced'>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPlansResponse {
  plans: PaymentPlan[];
}

export interface LessonAccess {
  hasAccess: boolean;
  requiresPayment: boolean;
  message?: string;
  planRequired?: string;
}

export interface CreatePaymentPlanRequest {
  name: string;
  description: string;
  type: PlanType;
  lessonType?: Extract<LessonType, 'center_recorded' | 'studio_produced'>;
  price: number;
  currency: 'EGP';
  duration: number;
  features: string[];
}

export interface CreatePaymentRequest {
  planId: string;
  amount: number;
  currency: 'EGP';
  paymentMethod: PaymentMethod;
  receiptUrl: string;
  notes?: string;
  lessonId?: string;
  subjectId?: string;
}

export interface StudentPayment {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: 'EGP';
  paymentMethod: PaymentMethod;
  planType: PlanType;
  subjectId?: string;
  subjectName?: string;
  lessonId?: string;
  lessonTitle?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayment extends StudentPayment {
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  academicYearId?: string;
  academicYearName?: string;
  studentYearId?: string;
  studentYearName?: string;
  transactionReference?: string;
}

export interface PaymentStatsOverview {
  stats: Array<{ planType: PlanType; count: number; revenue: number }>;
  totalRevenue: number;
  byMethod: Array<{ method: PaymentMethod; count: number; revenue: number }>;
}


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

