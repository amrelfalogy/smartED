export interface AccessibleLesson {
  id: string;
  title: string;
  description: string;
  unitId: string;
  unitName: string;
  subjectId: string;
  subjectName: string;
  lessonType: 'video' | 'document' | 'pdf' | 'text' | 'quiz' | 'assignment' | 'live';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  thumbnail?: string;
  videoUrl?: string;
  pdfUrl?: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  order: number;
  status: 'published' | 'draft';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  progressPercentage?: number;
  isCompleted?: boolean;
  // Access info
  accessGrantedAt: string;
  accessExpiresAt?: string;
  accessLevel: 'full' | 'preview';
  accessMethod: 'payment' | 'subscription' | 'activation_code' | 'free';
}

export interface SubscribedSubject {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price?: number;
  currency?: string;
  status: 'published' | 'draft';
  sessionType?: 'center_recorded' | 'studio' | 'live' | 'zoom' | 'recorded';
  academicYearId?: string;
  studentYearId?: string;
  academicYearName?: string;
  studentYearName?: string;
  instructorName?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  // Subscription info
  subscriptionId: string;
  subscribedAt: string;
  subscriptionExpiresAt?: string;
  subscriptionStatus: 'active' | 'expired' | 'cancelled';
  accessLevel: 'full' | 'preview';
  // Progress info
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastAccessedAt?: string;
  estimatedCompletionDate?: string;
}

export interface MyContentResponse {
  subjects?: SubscribedSubject[];
  lessons?: AccessibleLesson[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalItems: number;
  };
}

export interface MyContentFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  lessonType?: 'video' | 'document' | 'pdf' | 'text' | 'quiz' | 'assignment' | 'live';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  search?: string;
  sortBy?: 'recent' | 'name' | 'progress' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
}

export interface MyContentStats {
  totalSubjects: number;
  totalAccessibleLessons: number;
  completedLessons: number;
  averageProgress: number;
  totalStudyTime: number;
  streakDays: number;
  lastActivityDate?: string;
}