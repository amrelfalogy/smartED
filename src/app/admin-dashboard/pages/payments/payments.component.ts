import { Component, OnInit } from '@angular/core';
import { PaymentService } from 'src/app/core/services/payment.service';

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

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPaymentStats();
    this.loadPayments();
  }

  // ✅ Load Payment Statistics
  loadPaymentStats(): void {
    this.paymentService.getAdminPaymentStats().subscribe({
      next: (response) => {
        this.stats = response.data;
      },
      error: (error) => {
        console.error('Error loading payment stats:', error);
        this.loadMockStats();
      }
    });
  }

  // ✅ Load Payments List
  loadPayments(): void {
    this.isLoading = true;
    this.paymentService.getAdminPayments({
      page: this.currentPage,
      limit: this.itemsPerPage,
      status: this.statusFilter !== 'all' ? this.statusFilter : '',
      search: this.searchTerm
    }).subscribe({
      next: (response) => {
        this.payments = response.data.payments;
        this.totalItems = response.data.total;
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

  // ✅ Apply Filters
  applyFilters(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const matchesStatus = this.statusFilter === 'all' || payment.status === this.statusFilter;
      const matchesSearch = !this.searchTerm || 
        payment.studentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        payment.studentEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(this.searchTerm.toLowerCase());
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

  // ✅ Approve Payment
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

  // ✅ Reject Payment
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
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number, currency: string = 'EGP'): string {
    return `${amount.toLocaleString('en-US')} ${currency === 'EGP' ? 'جنيه' : currency}`;
  }

  trackByPayment(index: number, payment: Payment): string {
    return payment.id;
  }

  // Mock Data Functions (fallback)
  private loadMockStats(): void {
    this.stats = {
      totalPayments: 1250,
      pendingPayments: 45,
      approvedPayments: 1180,
      rejectedPayments: 25,
      totalRevenue: 2850000
    };
  }

  private loadMockPayments(): void {
    this.payments = [
      {
        id: 'PAY001',
        studentName: 'أحمد محمد علي',
        studentEmail: 'ahmed@example.com',
        amount: 500,
        currency: 'EGP',
        educationalStage: 'الثانوية العامة',
        studentGrade: 'الصف الثالث الثانوي',
        paymentPlan: 'شهري',
        status: 'pending',
        subscriptionType: 'اشتراك شامل',
        paymentMethod: 'فودافون كاش',
        transactionReference: 'VF123456789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'PAY002',
        studentName: 'فاطمة أحمد',
        studentEmail: 'fatma@example.com',
        amount: 1500,
        currency: 'EGP',
        educationalStage: 'الثانوية العامة',
        studentGrade: 'الصف الثاني الثانوي',
        paymentPlan: 'ربع سنوي',
        status: 'approved',
        subscriptionType: 'اشتراك الرياضيات',
        paymentMethod: 'تحويل بنكي',
        transactionReference: 'BANK987654321',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'PAY003',
        studentName: 'محمد حسن',
        studentEmail: 'mohamed@example.com',
        amount: 300,
        currency: 'EGP',
        educationalStage: 'الإعدادية',
        studentGrade: 'الصف الثالث الإعدادي',
        paymentPlan: 'شهري',
        status: 'rejected',
        subscriptionType: 'اشتراك العلوم',
        paymentMethod: 'أورانج موني',
        transactionReference: 'OR555666777',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    this.totalItems = this.payments.length;
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