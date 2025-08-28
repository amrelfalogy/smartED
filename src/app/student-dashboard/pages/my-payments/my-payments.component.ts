import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PaymentHistory, PaymentStats } from '../../../core/models/course-complete.model';

@Component({
  selector: 'app-my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss']
})
export class MyPaymentsComponent implements OnInit {
  paymentForm: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;
  
  stats: PaymentStats = {
    lastPayments: 5,
    pendingPayments: 2
  };

  paymentHistory: PaymentHistory[] = [
    {
      id: '1',
      course: 'أساسيات الرياضيات',
      amount: 500,
      currency: 'جنيه',
      method: 'Instapay',
      status: 'completed',
      date: new Date(Date.now() - 86400000), // 1 day ago
      reference: 'REF123456'
    },
    {
      id: '2',
      course: 'فيزياء الميكانيكا',
      amount: 600,
      currency: 'جنيه',
      method: 'Vodafone Cash',
      status: 'pending',
      date: new Date(Date.now() - 172800000), // 2 days ago
      reference: 'REF789012'
    }
  ];

  subscriptionTypes = [
    { value: 'semester', label: 'فصل دراسي كامل', price: 1000 },
    { value: 'lesson', label: 'درس واحد', price: 50 }
  ];

  courseTypes = [
    { value: 'weekly', label: 'الحصص الأسبوعية', description: 'حصص مباشرة أسبوعية' },
    { value: 'recorded', label: 'الكورس المسجل', description: 'مكتبة شاملة من الفيديوهات' }
  ];

  paymentMethods = [
    { value: 'instapay', label: 'Instapay', icon: 'fas fa-credit-card', color: '#9b51e0' },
    { value: 'vodafone', label: 'Vodafone Cash', icon: 'fas fa-mobile-alt', color: '#e41f1f' }
  ];

  paymentInstructions = `
    تعليمات الدفع:
    
    للدفع عبر Instapay:
    1. افتح تطبيق Instapay
    2. اختر "تحويل أموال"
    3. أدخل رقم المحفظة: 01234567890
    4. أدخل المبلغ المطلوب
    5. أكمل العملية
    6. ارفق إيصال الدفع هنا
    
    للدفع عبر Vodafone Cash:
    1. اتصل بـ *9*رقم المحفظة*المبلغ#
    2. رقم المحفظة: 01234567890
    3. اتبع التعليمات المطلوبة
    4. ارفق إيصال الدفع هنا
  `;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.paymentForm = this.fb.group({
      subscriptionType: ['', Validators.required],
      courseType: ['', Validators.required],
      course: ['', Validators.required],
      amount: [{ value: '', disabled: true }, Validators.required],
      paymentMethod: ['', Validators.required],
      transactionReference: [''],
      receipt: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['courseId']) {
        this.paymentForm.patchValue({
          course: params['courseId']
        });
      }
    });

    // Update amount when subscription type changes
    this.paymentForm.get('subscriptionType')?.valueChanges.subscribe(value => {
      const selectedType = this.subscriptionTypes.find(type => type.value === value);
      if (selectedType) {
        this.paymentForm.patchValue({ amount: selectedType.price });
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
    if (this.paymentForm.valid && this.selectedFile) {
      this.isSubmitting = true;

      // Simulate API call
      setTimeout(() => {
        // Add to payment history
        const newPayment: PaymentHistory = {
          id: Date.now().toString(),
          course: 'الدورة المحددة', // Should be actual course name
          amount: this.paymentForm.get('amount')?.value,
          currency: 'جنيه',
          method: this.getPaymentMethodLabel(this.paymentForm.get('paymentMethod')?.value),
          status: 'pending',
          date: new Date(),
          reference: this.paymentForm.get('transactionReference')?.value
        };

        this.paymentHistory.unshift(newPayment);
        this.stats.pendingPayments++;

        this.isSubmitting = false;
        this.resetForm();
        
        alert('تم إرسال طلب الدفع بنجاح! سيتم مراجعته وتأكيده خلال 24 ساعة.');
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  resetForm(): void {
    this.paymentForm.reset();
    this.selectedFile = null;
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
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
}