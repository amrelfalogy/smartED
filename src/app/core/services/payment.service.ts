// ✅ UPDATE: payment.service.ts - Complete rewrite to match backend
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  Payment,
  PaymentsResponse,
  PaymentStatsResponse,
  PaymentFilters,
  PaymentCreateRequest,
  CreatePaymentResponse,
  PaymentActionResponse,
  PaymentDisplayItem
} from '../models/payment.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private baseUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  // ✅ GET all payments with filters
  getPayments(filters: PaymentFilters = {}): Observable<PaymentsResponse> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.studentId) params = params.set('studentId', filters.studentId);
    if (filters.subjectId) params = params.set('subjectId', filters.subjectId);
    if (filters.lessonId) params = params.set('lessonId', filters.lessonId);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaymentsResponse>(this.baseUrl, { params });
  }

  // ✅ GET single payment by ID
  getPaymentById(paymentId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${paymentId}`);
  }

  // ✅ CREATE payment for subject
  createSubjectPayment(subjectId: string, payload: PaymentCreateRequest): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(`${this.baseUrl}/subjects/${subjectId}`, payload);
  }

  // ✅ CREATE payment for lesson
  createLessonPayment(lessonId: string, payload: PaymentCreateRequest): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(`${this.baseUrl}/lessons/${lessonId}`, payload);
  }

  // ✅ APPROVE payment (admin only)
  approvePayment(paymentId: string): Observable<PaymentActionResponse> {
    return this.http.put<PaymentActionResponse>(`${this.baseUrl}/${paymentId}/approve`, {});
  }

  // ✅ REJECT payment (admin only)
  rejectPayment(paymentId: string, reason?: string): Observable<PaymentActionResponse> {
    const body = reason ? { rejectionReason: reason } : {};
    return this.http.put<PaymentActionResponse>(`${this.baseUrl}/${paymentId}/reject`, body);
  }

  // ✅ GET payment statistics
  getPaymentStats(): Observable<PaymentStatsResponse> {
    return this.http.get<PaymentStatsResponse>(`${this.baseUrl}/stats/overview`);
  }

  // ✅ Helper methods for backward compatibility with existing dashboard code
  getPaymentStatsOverview(): Observable<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    revenue: number;
    totalRevenue: number;
  }> {
    return this.getPaymentStats().pipe(
      map((response: PaymentStatsResponse) => {
        const stats = response.stats || [];
        
        const pending = stats.find(s => s.status === 'pending') || { count: 0, total: '0' };
        const approved = stats.find(s => s.status === 'approved') || { count: 0, total: '0' };
        const rejected = stats.find(s => s.status === 'rejected') || { count: 0, total: '0' };
        
        const totalCount = pending.count + approved.count + rejected.count;
        const totalRevenue = response.totalRevenue || 0;

        return {
          total: totalCount,
          approved: approved.count,
          pending: pending.count,
          rejected: rejected.count,
          revenue: totalRevenue,
          totalRevenue: totalRevenue
        };
      })
    );
  }

  // ✅ Get payments count by status (for backward compatibility)
  getPaymentsTotalByStatus(status?: 'pending' | 'approved' | 'rejected'): Observable<number> {
    return this.getPaymentStats().pipe(
      map((response: PaymentStatsResponse) => {
        if (!status) {
          // Return total count
          return response.stats.reduce((total, stat) => total + stat.count, 0);
        }
        
        const stat = response.stats.find(s => s.status === status);
        return stat ? stat.count : 0;
      })
    );
  }

  // ✅ Transform Payment to UI display format
  transformToDisplayItem(payment: Payment): PaymentDisplayItem {
    const studentName = payment.student 
      ? `${payment.student.firstName} ${payment.student.lastName}`.trim()
      : 'غير محدد';
    
    const planType = payment.subjectId ? 'subject' : 'lesson';
    const targetName = payment.subject?.name || payment.lesson?.title || 'غير محدد';
    
    return {
      id: payment.id,
      studentName: studentName,
      studentEmail: payment.student?.email || 'غير محدد',
      amount: Number(payment.amount) || 0,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      planType: planType,
      targetName: targetName,
      transactionId: payment.transactionId || undefined,
      referenceNumber: payment.referenceNumber || undefined,
      receiptUrl: payment.receiptUrl || undefined,
      notes: payment.notes || undefined,
      adminNotes: payment.adminNotes || undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }

  // ✅ Get my payments (for student dashboard)
  getMyPayments(filters: Omit<PaymentFilters, 'studentId'> = {}): Observable<PaymentsResponse> {
    // This will be filtered server-side based on auth token
    return this.getPayments(filters);
  }
  
   // ✅ FIXED: Only check for subject-level payments (not lesson payments)
  checkSubjectAccess(subjectId: string): Observable<any> {
    console.log('🔍 Checking subject access for:', subjectId);
    
    // Check for payments that are specifically for the subject (no lessonId)
    return this.getPayments({ 
      subjectId: subjectId, 
      status: 'approved',
      limit: 50 // Get more to filter properly
    }).pipe(
      map((response: PaymentsResponse) => {
        // ✅ CRITICAL: Filter out lesson payments - only count subject-level payments
        const subjectOnlyPayments = response.payments.filter(payment => 
          payment.subjectId === subjectId && !payment.lessonId
        );
        
        const hasSubjectAccess = subjectOnlyPayments.length > 0;
        const result = { 
          hasAccess: hasSubjectAccess, 
          isFullAccess: hasSubjectAccess,
          accessType: hasSubjectAccess ? 'subject_paid' : 'none',
          enrollmentStatus: hasSubjectAccess ? 'enrolled' : 'not_enrolled'
        };
        
        console.log('✅ Subject access result:', {
          subjectId,
          totalPayments: response.payments.length,
          subjectOnlyPayments: subjectOnlyPayments.length,
          hasAccess: hasSubjectAccess
        });
        
        return result;
      }),
      catchError(error => {
        console.error('❌ Subject access check failed:', error);
        return of({ 
          hasAccess: false, 
          isFullAccess: false, 
          accessType: 'none',
          enrollmentStatus: 'not_enrolled'
        });
      })
    );
  }

  // ✅ FIXED: payment.service.ts - Enhanced lesson access check
checkLessonAccess(lessonId: string): Observable<{ hasAccess: boolean; requiresPayment: boolean; accessReason?: string }> {
  console.log('🔍 Checking lesson access for:', lessonId);
  
  // ✅ STEP 1: First try the lesson access endpoint (if available)
  return this.http.get<{ hasAccess: boolean; requiresPayment: boolean; accessReason?: string }>(`${environment.apiUrl}/content/lessons/${encodeURIComponent(lessonId)}/access`)
    .pipe(
      catchError(error => {
        console.warn('❌ Lesson access endpoint failed, using payment-based check:', error);
        
        // ✅ STEP 2: Check both subject-level and lesson-level access
        return this.checkLessonAccessViaPayments(lessonId);
      })
    );
}

// ✅ NEW: Comprehensive payment-based access check
private checkLessonAccessViaPayments(lessonId: string): Observable<{ hasAccess: boolean; requiresPayment: boolean; accessReason?: string }> {
  // Get lesson details to find the subject
  return this.http.get<any>(`${environment.apiUrl}/content/lessons/${lessonId}`).pipe(
    switchMap(lesson => {
      const subjectId = lesson.subjectId || lesson.lesson?.subjectId;
      
      if (!subjectId) {
        // If we can't get subject ID, just check lesson-specific payments
        return this.checkLessonOnlyAccess(lessonId);
      }
      
      // ✅ Check both subject and lesson access
      return forkJoin({
        subjectAccess: this.checkSubjectAccessInternal(subjectId),
        lessonAccess: this.checkLessonOnlyAccess(lessonId)
      }).pipe(
        map(({ subjectAccess, lessonAccess }) => {
          console.log('🔍 Combined access check:', {
            lessonId,
            subjectId,
            subjectAccess: subjectAccess.hasAccess,
            lessonAccess: lessonAccess.hasAccess
          });
          
          // ✅ CRITICAL: Subject access grants access to all lessons
          if (subjectAccess.hasAccess) {
            return {
              hasAccess: true,
              requiresPayment: false,
              accessReason: 'subject_enrollment'
            };
          }
          
          // Otherwise return lesson-specific access
          return lessonAccess;
        })
      );
    }),
    catchError(error => {
      console.error('❌ Could not get lesson details, checking lesson-only access:', error);
      return this.checkLessonOnlyAccess(lessonId);
    })
  );
}

// ✅ NEW: Check only lesson-specific access (not subject)
private checkLessonOnlyAccess(lessonId: string): Observable<{ hasAccess: boolean; requiresPayment: boolean; accessReason?: string }> {
  return this.getMyPayments({ 
    lessonId: lessonId, 
    limit: 50 
  }).pipe(
    map((response: PaymentsResponse) => {
      console.log('💳 Lesson-only payments:', response.payments);
      
      const hasAccess = response.payments.some(payment => {
        const isForThisLesson = payment.lessonId === lessonId;
        const isApproved = payment.status === 'approved';
        const isActivationGrant = payment.grantType === 'activation_code' || 
                                payment.notes?.toLowerCase().includes('activation') ||
                                payment.adminNotes?.toLowerCase().includes('activation');
        
        return isForThisLesson && (isApproved || isActivationGrant);
      });

      return {
        hasAccess: hasAccess,
        requiresPayment: !hasAccess,
        accessReason: hasAccess ? 'lesson_payment_or_activation' : 'no_access'
      };
    }),
    catchError(error => {
      console.error('❌ Lesson-only access check failed:', error);
      return of({ 
        hasAccess: false, 
        requiresPayment: true, 
        accessReason: 'error'
      });
    })
  );
}

// ✅ NEW: Internal subject access check (doesn't expose the complex return type)
private checkSubjectAccessInternal(subjectId: string): Observable<{ hasAccess: boolean; accessReason?: string }> {
  return this.getPayments({ 
    subjectId: subjectId, 
    status: 'approved',
    limit: 50
  }).pipe(
    map((response: PaymentsResponse) => {
      const subjectOnlyPayments = response.payments.filter(payment => 
        payment.subjectId === subjectId && !payment.lessonId
      );
      
      const hasAccess = subjectOnlyPayments.length > 0;
      
      return {
        hasAccess,
        accessReason: hasAccess ? 'subject_payment' : 'no_subject_access'
      };
    }),
    catchError(() => of({ hasAccess: false, accessReason: 'error' }))
  );
}

  // ✅ NEW: Check activation code access
  private checkActivationCodeAccess(lessonId: string): Observable<{ hasAccess: boolean; requiresPayment: boolean; accessReason?: string }> {
    return this.http.get<{ hasAccess: boolean; requiresPayment: boolean; accessReason?: string }>(`${environment.apiUrl}/activation-access/lessons/${encodeURIComponent(lessonId)}`)
      .pipe(
        catchError(error => {
          console.warn('❌ Activation code access check failed:', error);
          return of({
            hasAccess: false,
            requiresPayment: true,
            accessReason: 'no_activation'
          });
        })
      );
  }

  // ✅ CHECK zoom access (for live lessons)
  checkZoomAccess(lessonId: string): Observable<{ hasAccess: boolean; zoomUrl?: string; meetingId?: string; passcode?: string }> {
    return this.http.get<{ hasAccess: boolean; zoomUrl?: string; meetingId?: string; passcode?: string }>(`${environment.apiUrl}/content/lessons/${encodeURIComponent(lessonId)}/zoom`);
  }
}