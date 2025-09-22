// ✅ CREATE/UPDATE: payment.model.ts - Match backend API structure
export type PaymentMethod = 'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | string;
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentCreateRequest {
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  notes?: string;
  transactionId?: string;
  referenceNumber?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  academicYearId: string;
  studentYearId: string;
  teacherId: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  subjectId: string;
}

export interface Approver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Payment {
  id: string;
  studentId: string;
  subjectId?: string | null;
  lessonId?: string | null;
  amount: string; // Backend sends as string
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  metadata?: any;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  grantType?: string | null; // e.g., 'activation_code'
  
  // Populated relations
  student?: Student;
  subject?: Subject;
  lesson?: Lesson;
  approver?: Approver;
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
}

export interface PaymentStatsItem {
  status: PaymentStatus;
  count: number;
  total: string; // Backend sends as string
}

export interface PaymentStatsResponse {
  stats: PaymentStatsItem[];
  totalRevenue: number;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: PaymentStatus | '';
  search?: string;
  studentId?: string;
  subjectId?: string;
  lessonId?: string;
  sortBy?: 'createdAt' | 'amount' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreatePaymentResponse {
  message: string;
  payment: Payment;
}

export interface PaymentActionResponse {
  message: string;
  payment: Payment;
}

// UI-specific interfaces
export interface PaymentDisplayItem {
  id: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  planType: 'subject' | 'lesson';
  targetName: string; // subject name or lesson title
  transactionId?: string;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}