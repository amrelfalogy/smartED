import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  PaymentHistory,
  PaymentPlan,
  PaymentPlansResponse,
  PlanType,
  CreatePaymentRequest,
  PaymentMethod
} from '../../../core/models/course-complete.model';
import { PaymentService } from 'src/app/core/services/payment.service';
import { FileUploadService, FileUploadResponse, FileUploadProgress } from 'src/app/core/services/file-upload.service';

@Component({
  selector: 'app-my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss']
})
export class MyPaymentsComponent implements OnInit {
  paymentForm: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;

  showForm = false;

  // Intent from query
  planType: PlanType | null = null;
  lessonType: string | null = null;
  lessonId: string | null = null;
  subjectId: string | null = null;

  selectedPlan: PaymentPlan | null = null;

  paymentHistory: PaymentHistory[] = [];
  stats = { lastPayments: 0, pendingPayments: 0 };

  paymentMethods = [
    { value: 'instapay', label: 'Instapay', icon: 'pi pi-credit-card', color: '#9b51e0' },
    { value: 'vodafone_cash', label: 'Vodafone Cash', icon: 'pi pi-mobile', color: '#e41f1f' }
  ];

  paymentInstructions = `
تعليمات الدفع:

Instapay:
1) افتح تطبيق Instapay
2) حوّل إلى: 01234567890
3) أدخل المبلغ الظاهر في النموذج
4) بعد الدفع، ارفع إيصال الدفع هنا

Vodafone Cash:
1) *9*رقم-المحفظة*المبلغ#
2) رقم المحفظة: 01234567890
3) بعد الدفع، ارفع إيصال الدفع هنا
`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private fileUploadService: FileUploadService
  ) {
    this.paymentForm = this.fb.group({
      amount: [{ value: '', disabled: true }, Validators.required],
      paymentMethod: ['', Validators.required],
      transactionReference: [''],
      notes: [''],
      receipt: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadHistory();

    this.route.queryParams.subscribe(params => {
      this.planType = (params['planType'] as PlanType) || null;
      this.lessonId = params['lessonId'] || null;
      this.subjectId = params['subjectId'] || null;
      this.lessonType = params['lessonType'] || null;

      this.showForm = !!this.planType && (!!this.lessonId || !!this.subjectId);

      if (this.showForm && this.planType) {
        // Robust plan resolution with fallback handled inside the service as well
        this.resolvePlan(this.lessonType || undefined, this.planType);
      } else {
        this.selectedPlan = null;
        this.paymentForm.reset();
        this.selectedFile = null;
      }
    });
  }

  private resolvePlan(lessonType: string | undefined, planType: PlanType): void {
    // Try with lessonType; if server errors, fallback inside service will fetch with type only.
    this.paymentService.getPaymentPlans(lessonType, planType).subscribe({
      next: (res: PaymentPlansResponse) => {
        const active = (res.plans || []).filter(p => p.isActive && p.type === planType);
        if (active.length === 0) {
          alert('لا توجد خطة فعّالة متاحة.');
          this.showForm = false;
          return;
        }
        this.selectedPlan = active[0];
        this.paymentForm.patchValue({ amount: this.selectedPlan.price });
      },
      error: (err) => {
        console.error('Error loading plans (after fallback):', err);
        alert('تعذر تحميل الخطط، حاول لاحقاً.');
        this.showForm = false;
      }
    });
  }

  private loadHistory(): void {
    this.paymentService.getPayments({ page: 1, limit: 20 }).subscribe({
      next: (res) => {
        const list: any[] = (res as any).payments || (res as any).data?.payments || [];
        this.paymentHistory = list.map(p => ({
          id: p.id,
          course: p.subjectName || p.lessonTitle || 'دفع',
          amount: Number(p.amount ?? p.amount_cents ? (p.amount_cents / 100) : p.amount) || 0,
          currency: 'جنيه',
          method: this.getPaymentMethodLabel(p.paymentMethod || p.method || ''),
          status: p.status === 'approved' ? 'completed' : p.status === 'pending' ? 'pending' : 'failed',
          date: new Date(p.createdAt),
          reference: p.transactionReference
        }));
        this.stats.lastPayments = this.paymentHistory.filter(h => h.status === 'completed').length;
        this.stats.pendingPayments = this.paymentHistory.filter(h => h.status === 'pending').length;
      },
      error: () => {
        this.paymentHistory = [];
      }
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      this.paymentForm.patchValue({ receipt: file.name });
    }
  }

  onSubmit(): void {
    if (!this.showForm || !this.paymentForm.valid || !this.selectedFile || !this.selectedPlan) {
      this.markFormGroupTouched();
      return;
    }

    this.fileUploadService.uploadReceipt(this.selectedFile).subscribe({
      next: (evt: FileUploadResponse | FileUploadProgress) => {
        if ('progress' in evt) return;
        const receiptUrl = evt.url;
        const payload: CreatePaymentRequest = {
          planId: this.selectedPlan!.id,
          amount: this.selectedPlan!.price,
          currency: 'EGP',
          paymentMethod: this.paymentForm.get('paymentMethod')?.value as PaymentMethod,
          receiptUrl,
          notes: this.paymentForm.get('notes')?.value || '',
          lessonId: this.planType === 'lesson' ? this.lessonId || undefined : undefined,
          subjectId: this.planType !== 'lesson' ? this.subjectId || undefined : undefined
        };

        this.paymentService.createPayment(payload).subscribe({
          next: () => {
            alert('تم إرسال طلب الدفع بنجاح!');
            this.loadHistory();
            this.resetForm();
            this.showForm = false;
          },
          error: (err) => {
            console.error('Create payment error:', err);
            alert('حدث خطأ أثناء إرسال الدفع.');
          }
        });
      },
      error: (err) => {
        console.error('Upload receipt error:', err);
        alert('تعذر رفع الإيصال.');
      }
    });
  }

  resetForm(): void {
    this.paymentForm.reset();
    this.selectedFile = null;
    this.selectedPlan = null;
  }

  markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      this.paymentForm.get(key)?.markAsTouched();
    });
  }

  getPaymentMethodLabel(value: string): string {
    const method = this.paymentMethods.find(m => m.value === value);
    return method ? method.label : value;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'pending': return 'في انتظار التأكيد';
      case 'failed': return 'فشل';
      default: return status;
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  }
}