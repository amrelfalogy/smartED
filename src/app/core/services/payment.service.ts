import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import {
  PaymentPlansResponse,
  PaymentPlan,
  CreatePaymentPlanRequest,
  LessonAccess,
  CreatePaymentRequest,
  StudentPayment,
  PaymentStatsOverview,
  PaymentStatus,
  PlanType
} from '../models/course-complete.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Plans with robust fallback:
  // 1) Try ?type=<type>&lessonType=<lessonType>
  // 2) If 4xx/5xx, try ?type=<type>&lesson_type=<lessonType>
  // 3) If still failing, try ?type=<type> only
  getPaymentPlans(lessonType?: string, type?: PlanType): Observable<PaymentPlansResponse> {
    const buildParams = (opts: { type?: PlanType; lessonTypeKey?: 'lessonType' | 'lesson_type'; lessonType?: string }) => {
      let params = new HttpParams();
      if (opts.type) params = params.set('type', opts.type);
      if (opts.lessonType && opts.lessonTypeKey) params = params.set(opts.lessonTypeKey, opts.lessonType);
      return params;
    };

    const url = `${this.baseUrl}/payments/plans`;

    // First attempt: lessonType as camelCase (current FE expectation)
    const firstParams = buildParams({ type, lessonTypeKey: lessonType ? 'lessonType' : undefined, lessonType });
    return this.http.get<PaymentPlansResponse>(url, { params: firstParams }).pipe(
      catchError(err => {
        if (!lessonType) {
          // No lessonType provided → propagate the error
          return throwError(() => err);
        }

        // Second attempt: snake_case key
        const secondParams = buildParams({ type, lessonTypeKey: 'lesson_type', lessonType });
        return this.http.get<PaymentPlansResponse>(url, { params: secondParams }).pipe(
          catchError(err2 => {
            // Final attempt: type only
            const thirdParams = buildParams({ type, lessonTypeKey: undefined, lessonType: undefined });
            return this.http.get<PaymentPlansResponse>(url, { params: thirdParams });
          })
        );
      })
    );
  }

  createPaymentPlan(planData: CreatePaymentPlanRequest): Observable<PaymentPlan> {
    return this.http.post<PaymentPlan>(`${this.baseUrl}/payments/plans`, {
      ...planData,
      currency: 'EGP'
    });
  }

  // Access
  checkLessonAccess(lessonId: string): Observable<any> {
    return this.http.get(`/api/content/lessons/${lessonId}/access`)
      .pipe(
        map(response => {
          console.log('✅ Lesson access response:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Lesson access error:', error);
          throw error;
        })
      );
  }

  // Payments (student create)
  createPayment(payload: CreatePaymentRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments`, payload);
  }

  // Lists (role-based)
  getPayments(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus | '';
    method?: string;
    planType?: PlanType | '';
    subjectId?: string;
    lessonId?: string;
    search?: string;
  }): Observable<{ payments: any[]; pagination: { total: number; pages: number; currentPage: number; limit: number } }> {
    let httpParams = new HttpParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<{ payments: any[]; pagination: any }>(`${this.baseUrl}/payments`, { params: httpParams });
  }

  getPaymentStatsOverview(): Observable<PaymentStatsOverview> {
    return this.http.get<PaymentStatsOverview>(`${this.baseUrl}/payments/stats/overview`);
  }

  getPaymentsTotalByStatus(status?: PaymentStatus): Observable<number> {
    let params = new HttpParams().set('limit', '1').set('page', '1');
    if (status) params = params.set('status', status);
    return this.http
      .get<{ payments: any[]; pagination: { total: number } }>(`${this.baseUrl}/payments`, { params })
      .pipe(map(res => res.pagination?.total ?? 0));
  }

  approvePayment(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/${paymentId}/approve`, {});
  }

  rejectPayment(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/${paymentId}/reject`, {});
  }
}