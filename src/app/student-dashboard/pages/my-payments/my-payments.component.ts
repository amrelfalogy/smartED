import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject as RxSubject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PaymentService } from 'src/app/core/services/payment.service';
import { PaymentCreateRequest } from 'src/app/core/models/payment.model';
import { SubjectService } from 'src/app/core/services/subject.service';
import { LessonService } from 'src/app/core/services/lesson.service';
import { Subject, Lesson } from 'src/app/core/models/course-complete.model';

import { ActivationCodeService } from 'src/app/core/services/activation-code.service';
import { CodeActivateResponse } from 'src/app/core/models/activation-code.model';

type PlanType = 'subject' | 'lesson';
type ViewMode = 'form' | 'history';
type AccessMethod = 'payment' | 'activation';

@Component({
  selector: 'app-my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss']
})
export class MyPaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new RxSubject<void>();

  // View mode
  viewMode: ViewMode = 'history';

  // Access Method Selection
  selectedAccessMethod: AccessMethod = 'payment';
  showAccessOptions = true;

  // Query params
  planType: PlanType = 'subject';
  subjectId: string | null = null;
  lessonId: string | null = null;
  lessonType: string | null = null;

  // Target
  subject: Subject | null = null;
  lesson: Lesson | null = null;

  // Amount
  amount: number | null = null;
  currency = 'EGP';

  // Form
  paymentMethod: 'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' = 'cash';
  receiptUrl = '';
  notes = '';
  transactionId = '';
  referenceNumber = '';

  // New Activation code state
  showActivationModal = false;
  activationSuccess = false;
  activationMessage = '';

  // Payment History
  payments: any[] = [];
  paymentsLoading = false;

  // Stats
  totalPayments = 0;
  pendingPayments = 0;
  completedPayments = 0;

  // State
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private subjectService: SubjectService,
    private lessonService: LessonService,
    private activationCodeService: ActivationCodeService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (qp) => {
        const hasPaymentParams = qp.has('planType') && (qp.has('subjectId') || qp.has('lessonId'));
        
        if (hasPaymentParams) {
          // Show payment form
          this.viewMode = 'form';
          await this.loadPaymentForm(qp);
        } else {
          // Show payment history
          this.viewMode = 'history';
          await this.loadPaymentHistory();
        }
      });

      this.activationCodeService.onActivationSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        if (response) {
          this.handleActivationSuccess(response);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.activationCodeService.clearActivationSuccess();
  }

  private async loadPaymentForm(qp: any): Promise<void> {
    this.resetState();
    
    const pt = (qp.get('planType') as PlanType) || 'subject';
    this.planType = pt;
    this.subjectId = qp.get('subjectId');
    this.lessonId = qp.get('lessonId');
    this.lessonType = qp.get('lessonType'); // NEW: Get lesson type

    try {
      if (this.planType === 'subject') {
        if (!this.subjectId) throw new Error('subjectId مفقود');
        this.subject = await firstValueFrom(this.subjectService.getSubject(this.subjectId));
        this.amount = this.subject?.price ?? null;
      } else {
        if (!this.lessonId) throw new Error('lessonId مفقود');
        this.lesson = await firstValueFrom(this.lessonService.getLessonById(this.lessonId));
        this.amount = this.lesson?.price ?? null;
      }
    } catch (e: any) {
      this.error = e?.friendlyMessage || e?.message || 'تعذر تحميل بيانات الدفع';
    }
  }

  private async loadPaymentHistory(): Promise<void> {
    this.paymentsLoading = true;
    this.error = null;

    try {
      const response = await firstValueFrom(this.paymentService.getMyPayments());
      this.payments = Array.isArray(response) ? response : (response?.payments || []);
      
      if (this.payments.length > 0) {
        console.log('Payment object structure:', this.payments[0]);
      }

      // Calculate stats
      this.totalPayments = this.payments.length;
      this.pendingPayments = this.payments.filter(p => p.status === 'pending').length;
      this.completedPayments = this.payments.filter(p => p.status === 'approved').length;
      
    } catch (e: any) {
      this.error = e?.error?.message || e?.message || 'تعذر تحميل تاريخ المدفوعات';
      this.payments = [];
    } finally {
      this.paymentsLoading = false;
    }
  }

  private resetState(): void {
    this.subject = null;
    this.lesson = null;
    this.amount = null;
    this.currency = 'EGP';
    this.paymentMethod = 'cash';
    this.receiptUrl = '';
    this.notes = '';
    this.transactionId = '';
    this.referenceNumber = '';
    this.isSubmitting = false;
    this.error = null;
    this.success = null;
    this.activationSuccess = false;
    this.activationMessage = '';
    this.showActivationModal = false;
    this.selectedAccessMethod = 'payment';
  }

  // Access Method Selection

  selectAccessMethod(method: AccessMethod): void {
    this.selectedAccessMethod = method;
    this.error = null;
    this.success = null;

    if (method === 'activation') {
      this.showActivationModal = true;
    }
  }
  
  // ✅ FIXED: my-payments.component.ts - Remove conflicting navigation
  // ✅ FIXED: Simplified success handler - no navigation conflict
  public handleActivationSuccess(response: CodeActivateResponse): void {
    console.log('🎯 My-Payments: Activation success received:', response);
    
    this.activationSuccess = true;
    this.activationMessage = response.message || 'تم تفعيل الرمز بنجاح!';
    this.success = this.activationMessage;
    this.showActivationModal = false;
    
    // ✅ CRITICAL: Don't navigate - let activation component handle it
    console.log('✅ Activation success handled in my-payments, component will handle navigation');
  }
  
  onActivationError(errorMessage: string): void {
    this.error = errorMessage;
    this.showActivationModal = false;
  }
  
  onActivationClose(): void {
    this.showActivationModal = false;
  }

  async submit(): Promise<void> {
    this.error = null;
    this.success = null;

    if (!this.amount || this.amount <= 0) {
      this.error = 'المبلغ غير متاح لهذه العملية';
      return;
    }

    this.isSubmitting = true;

    try {
      const payload: PaymentCreateRequest = {
        paymentMethod: this.paymentMethod,
        receiptUrl: this.receiptUrl.trim() || undefined,
        notes: this.notes?.trim() || undefined,
        transactionId: this.transactionId?.trim() || undefined,
        referenceNumber: this.referenceNumber?.trim() || undefined
      };

      let response;
      if (this.planType === 'subject') {
        if (!this.subjectId) throw new Error('subjectId مفقود');
        response = await firstValueFrom(
          this.paymentService.createSubjectPayment(this.subjectId, payload)
        );
      } else {
        if (!this.lessonId) throw new Error('lessonId مفقود');
        response = await firstValueFrom(
          this.paymentService.createLessonPayment(this.lessonId, payload)
        );
      }

      this.success = response.message || 'تم إرسال عملية الدفع بنجاح، في انتظار الموافقة.';
      
      setTimeout(() => {
        this.router.navigate(['/student-dashboard/payments/history']);
      }, 1200);
      
    } catch (e: any) {
      this.error = e?.error?.message || e?.message || 'تعذر إرسال عملية الدفع';
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack(): void {
    if (this.lessonId) {
      this.router.navigate(['/student-dashboard/lesson-details', this.lessonId]);
    } else if (this.subjectId) {
      this.router.navigate(['/student-dashboard/course-details', this.subjectId]);
    } else {
      this.router.navigate(['/student-dashboard/courses']);
    }
  }

  // Navigation methods
  goToHistory(): void {
    this.router.navigate(['/student-dashboard/payments/history']);
  }

  makeNewPayment(): void {
    this.router.navigate(['/student-dashboard/courses']);
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'مقبول';
      case 'pending': return 'في الانتظار';
      case 'rejected': return 'مرفوض';
      default: return 'غير محدد';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  trackPayment(index: number, payment: any): any {
    return payment.id || index;
  }

  getPaymentTitle(payment: any): string {
    // Try different possible property names from the payment object
    return payment.subjectName || 
          payment.courseName || 
          payment.lessonTitle ||
          payment.lessonName ||
          payment.itemName ||
          payment.title ||
          payment.name ||
          (payment.type === 'subject' ? 'مادة دراسية' : 'درس') ||
          'غير محدد';
  }
  getPaymentType(payment: any): 'subject' | 'lesson' {
    return payment.planType || payment.type || 
          (payment.subjectId ? 'subject' : 'lesson');
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'cash': return 'كاش';
      case 'instapay': return 'InstaPay';
      case 'vodafone_cash': return 'فودافون كاش';
      case 'bank_transfer': return 'تحويل بنكي';
      default: return method;
    }
  }

  get contentTypeLabel(): string {
    if (this.planType === 'subject') return 'المادة كاملة';
    if (this.lessonType) {
      switch (this.lessonType) {
        case 'video': return 'درس فيديو';
        case 'pdf': return 'درس PDF';
        case 'document': return 'درس مستند';
        case 'live': return 'جلسة مباشرة';
        default: return 'درس';
      }
    }
    return 'درس';
  }
}