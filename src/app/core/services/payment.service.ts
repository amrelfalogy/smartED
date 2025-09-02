import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentPlansResponse, PaymentPlan, CreatePaymentPlanRequest, LessonAccess } from '../models/course-complete.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseUrl = '/api'; // This will use your proxy

  constructor(private http: HttpClient) {}

  // ✅ Get payment plans
  getPaymentPlans(lessonType?: string): Observable<PaymentPlansResponse> {
    let params = new HttpParams();
    if (lessonType) {
      params = params.set('lessonType', lessonType);
    }
    return this.http.get<PaymentPlansResponse>(`${this.baseUrl}/payments/plans`, { params });
  }

  // ✅ Create payment plan
  createPaymentPlan(planData: CreatePaymentPlanRequest): Observable<PaymentPlan> {
    return this.http.post<PaymentPlan>(`${this.baseUrl}/payments/plans`, planData);
  }

  // ✅ Check lesson access
  checkLessonAccess(lessonId: string): Observable<LessonAccess> {
    return this.http.get<LessonAccess>(`${this.baseUrl}/content/lessons/${lessonId}/access`);
  }

  // ✅ Subscribe to plan
  subscribeToPlan(planId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/subscribe`, { planId });
  }

  // ✅ Process payment
  processPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/process`, paymentData);
  }
  // ...existing code...

// ✅ Admin: Get payment stats
getAdminPaymentStats(): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/admin/payments/stats`);
}

// ✅ Admin: Get payments list
getAdminPayments(params: { page: number; limit: number; status?: string; search?: string }): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/admin/payments`, { params });
}

// ✅ Admin: Approve payment
approvePayment(paymentId: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/payments/${paymentId}/approve`, {});
}

// ✅ Admin: Reject payment
rejectPayment(paymentId: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/payments/${paymentId}/reject`, {});
}
}