import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AcademicYearService } from 'src/app/core/services/academic-year.service';

interface PaymentStats {
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
}

interface Payment {
  id: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  currency: string;
  educationalStage: string;
  studentGrade: string;
  paymentPlan: string;
  status: 'pending' | 'approved' | 'rejected';
  subscriptionType: string;
  paymentMethod: string;
  transactionReference?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;

  // Optional backend fields we might map from:
  academicYearId?: string;
  academicYearName?: string;
  studentYearId?: string;
  studentYearName?: string;
  planType?: 'lesson' | 'monthly' | 'semester';
  subjectName?: string;
  lessonTitle?: string;
}

@Component({
  selector: 'app-payment',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  stats: PaymentStats = {
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    totalRevenue: 0
  };

  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  selectedPayment: Payment | null = null;
  showPaymentDetails = false;
  isLoading = false;
  isProcessing = false;

  // Filters
  statusFilter: string = 'all';
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // AY/SY mapping caches
  private academicYearMap = new Map<string, string>();
  private studentYearMap = new Map<string, Map<string, string>>(); // ayId -> (syId -> name)

  constructor(
    private paymentService: PaymentService,
    private academicYearService: AcademicYearService
  ) {}

  ngOnInit(): void {
    // Preload AY/SY maps (best effort; table will render even if mapping not ready)
    this.preloadAcademicMappings(() => {
      this.loadPaymentStats();
      this.loadPayments();
    });
  }

  // Load counts client-side + revenue overview
  loadPaymentStats(): void {
    forkJoin({
      total: this.paymentService.getPaymentsTotalByStatus(),
      pending: this.paymentService.getPaymentsTotalByStatus('pending'),
      approved: this.paymentService.getPaymentsTotalByStatus('approved'),
      rejected: this.paymentService.getPaymentsTotalByStatus('rejected'),
      overview: this.paymentService.getPaymentStatsOverview()
    }).subscribe({
      next: ({ total, pending, approved, rejected, overview }) => {
        this.stats.totalPayments = total;
        this.stats.pendingPayments = pending;
        this.stats.approvedPayments = approved;
        this.stats.rejectedPayments = rejected;
        this.stats.totalRevenue = overview.totalRevenue || 0;
      },
      error: (error) => {
        console.error('Error loading payment stats:', error);
        this.loadMockStats();
      }
    });
  }

  loadPayments(): void {
    this.isLoading = true;
    this.paymentService.getPayments({
      page: this.currentPage,
      limit: this.itemsPerPage,
      status: this.statusFilter !== 'all' ? (this.statusFilter as any) : '',
      search: this.searchTerm
    }).subscribe({
      next: (response) => {
        const list = (response as any).payments || (response as any).data?.payments || [];
        this.totalItems = (response as any).pagination?.total || (response as any).data?.total || list.length;

        // Map AY/SY names if only IDs provided
        this.payments = list.map((p: any) => this.mapBackendPaymentToUI(p));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.isLoading = false;
        this.loadMockPayments();
      }
    });
  }

  private mapBackendPaymentToUI(p: any): Payment {
    const ayName = p.academicYearName
      || (p.academicYearId && this.academicYearMap.get(p.academicYearId))
      || p.educationalStage
      || '';

    let syName = p.studentYearName || '';
    if (!syName) {
      if (p.studentYearId && p.academicYearId) {
        const syMap = this.studentYearMap.get(p.academicYearId);
        syName = syMap?.get(p.studentYearId) || '';
      }
      if (!syName) syName = p.studentGrade || '';
    }

    const planLabel =
      p.plan?.name ||
      (p.planType === 'monthly' ? 'شهري' : p.planType === 'semester' ? 'فصلي' : p.planType === 'lesson' ? 'درس' : (p.paymentPlan || ''));

    const subscriptionTarget =
      p.subjectName || p.lessonTitle || p.subscriptionType || '';

    return {
      id: p.id,
      studentName: p.user?.name || p.studentName || '',
      studentEmail: p.user?.email || p.studentEmail || '',
      amount: Number(p.amount ?? p.amount_cents ? (p.amount_cents / 100) : p.amount) || 0,
      currency: 'EGP',
      educationalStage: ayName,
      studentGrade: syName,
      paymentPlan: planLabel,
      status: p.status,
      subscriptionType: subscriptionTarget,
      paymentMethod: p.paymentMethod || p.method || '',
      transactionReference: p.transactionReference,
      receiptUrl: p.receiptUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,

      academicYearId: p.academicYearId,
      academicYearName: ayName,
      studentYearId: p.studentYearId,
      studentYearName: syName,
      planType: p.planType,
      subjectName: p.subjectName,
      lessonTitle: p.lessonTitle
    };
  }

  private preloadAcademicMappings(done: () => void): void {
    this.academicYearService.getAcademicYears().subscribe({
      next: (ays) => {
        ays.forEach(ay => this.academicYearMap.set(ay.id, (ay as any).displayName || ay.name));
        // Load student years for each AY (best effort)
        let remaining = ays.length;
        if (remaining === 0) return done();
        ays.forEach(ay => {
          this.academicYearService.getStudentYears(ay.id).subscribe({
            next: (sys) => {
              const map = new Map<string, string>();
              sys.forEach(sy => map.set(sy.id, (sy as any).displayName || sy.name));
              this.studentYearMap.set(ay.id, map);
            },
            error: () => {},
            complete: () => {
              remaining -= 1;
              if (remaining === 0) done();
            }
          });
        });
      },
      error: () => done()
    });
  }

  // Filters
  applyFilters(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const matchesStatus = this.statusFilter === 'all' || payment.status === this.statusFilter;
      const s = (this.searchTerm || '').toLowerCase();
      const matchesSearch = !s ||
        payment.studentName.toLowerCase().includes(s) ||
        payment.studentEmail.toLowerCase().includes(s) ||
        payment.id.toLowerCase().includes(s) ||
        payment.subscriptionType.toLowerCase().includes(s);
      return matchesStatus && matchesSearch;
    });
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadPayments();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  showDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.showPaymentDetails = true;
  }

  closeDetails(): void {
    this.showPaymentDetails = false;
    this.selectedPayment = null;
  }

  approvePayment(paymentId: string): void {
    this.isProcessing = true;
    this.paymentService.approvePayment(paymentId).subscribe({
      next: () => {
        this.updatePaymentStatus(paymentId, 'approved');
        this.isProcessing = false;
        this.closeDetails();
        this.showSuccessMessage('تم قبول الدفعة بنجاح');
        this.loadPaymentStats();
      },
      error: (error) => {
        console.error('Error approving payment:', error);
        this.isProcessing = false;
        this.showErrorMessage('حدث خطأ أثناء قبول الدفعة');
      }
    });
  }

  rejectPayment(paymentId: string): void {
    this.isProcessing = true;
    this.paymentService.rejectPayment(paymentId).subscribe({
      next: () => {
        this.updatePaymentStatus(paymentId, 'rejected');
        this.isProcessing = false;
        this.closeDetails();
        this.showSuccessMessage('تم رفض الدفعة');
        this.loadPaymentStats();
      },
      error: (error) => {
        console.error('Error rejecting payment:', error);
        this.isProcessing = false;
        this.showErrorMessage('حدث خطأ أثناء رفض الدفعة');
      }
    });
  }

  private updatePaymentStatus(paymentId: string, status: 'approved' | 'rejected'): void {
    const payment = this.payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = status;
      payment.updatedAt = new Date().toISOString();
    }
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayments();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedPayments(): Payment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPayments.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      default: return 'غير محدد';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatCurrency(amount: number, currency: string = 'EGP'): string {
    return `${amount.toLocaleString('en-US')} ${currency === 'EGP' ? 'جنيه' : currency}`;
  }

  trackByPayment(index: number, payment: Payment): string {
    return payment.id;
  }

  // Mock fallback
  private loadMockStats(): void {
    this.stats = {
      totalPayments: 0,
      pendingPayments: 0,
      approvedPayments: 0,
      rejectedPayments: 0,
      totalRevenue: 0
    };
  }

  private loadMockPayments(): void {
    this.payments = [];
    this.totalItems = 0;
    this.applyFilters();
    this.isLoading = false;
  }

  private showSuccessMessage(message: string): void {
    console.log('Success:', message);
  }
  private showErrorMessage(message: string): void {
    console.error('Error:', message);
  }
}