export interface ActivationCode {
  id: string;
  code: string;
  name?: string | null;
  description?: string | null;
  contentType: 'lesson' | 'subject' | 'unit';
  subjectId?: string | null;
  unitId?: string | null;
  lessonId?: string | null;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  expiresAt: string;
  createdBy: string;
  isActive: boolean;
  allowMultipleUses: boolean;
  restrictToAcademicYear: boolean;
  academicYearId?: string | null;
  studentYearId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodeGenerateRequest {
  lessonId: string;
  subjectId?: string;
  unitId?: string;
  name?: string;
  description?: string;
  maxUses?: number;
  validFrom?: string;
  expiresAt?: string;
  allowMultipleUses?: boolean;
  restrictToAcademicYear?: boolean;
  academicYearId?: string;
  studentYearId?: string;
}

export interface CodeGenerateResponse {
  message: string;
  activationCode: ActivationCode;
  contentItem: {
    id: string;
    title: string;
    description: string;
    content?: string | null;
    unitId?: string;
    academicYearId?: string | null;
    studentYearId?: string | null;
    thumbnail?: string | null;
    videoUrl?: string | null;
    pdfUrl?: string | null;
    pdfFileName?: string | null;
    pdfFileSize?: number | null;
    pdfCloudinaryId?: string | null;
    duration?: number;
    price?: number;
    currency?: string;
    isFree?: boolean;
    difficulty?: string;
    lessonType?: string;
    zoomUrl?: string | null;
    zoomMeetingId?: string | null;
    zoomPasscode?: string | null;
    scheduledAt?: string | null;
    status?: string;
    isActive?: boolean;
    order?: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CodeActivateRequest {
  code: string;
}

export interface CodeActivateResponse {
  message: string;
  access: {
    id: string;
    studentId: string;
    subjectId?: string | null;
    lessonId?: string | null;
    paymentId?: string | null;
    grantedAt: string;
    expiresAt: string;
    isActive: boolean;
    accessLevel: string;
    createdAt: string;
    updatedAt: string;
  };
  accessGranted: {
    lessonId?: string | null;
    unitId?: string | null;
    subjectId?: string | null;
  };
}

export interface CodesListResponse {
  codes: ActivationCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalItems: number;
  };
}

export interface CodeDetailsResponse {
  code: ActivationCode;
  usageHistory: CodeUsageHistory[];
}

export interface CodeUsageHistory {
  id: string;
  studentId: string;
  usedAt: string;
  ipAddress: string;
  userAgent: string;
  studentEmail: string;
  studentName: string;
}

export interface CodeStats {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  unusedCodes: number;
  codesByType: {
    contentType: string;
    count: number;
  }[];
}

export interface CodesListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  contentType?: 'lesson' | 'subject' | 'unit';
  search?: string;
  createdBy?: string;
}

// For validation and UI feedback
export interface CodeValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}

// For activation UI states
export interface ActivationAttempt {
  code: string;
  isSubmitting: boolean;
  result?: 'success' | 'error' | 'expired' | 'used' | 'invalid';
  message?: string;
  access?: CodeActivateResponse['access'];
}