// ✅ UPDATE: payments.component.ts - Use new service
import { Component, OnInit } from '@angular/core';
import { PaymentService } from 'src/app/core/services/payment.service';
import { Payment, PaymentDisplayItem } from 'src/app/core/models/payment.model';

interface PaymentStats {
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-payments',
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

  payments: PaymentDisplayItem[] = [];
  filteredPayments: PaymentDisplayItem[] = [];
  selectedPayment: PaymentDisplayItem | null = null;
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
  totalPages = 1;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPaymentStats();
    this.loadPayments();
  }

  loadPaymentStats(): void {
    this.paymentService.getPaymentStatsOverview().subscribe({
      next: (stats) => {
        this.stats.totalPayments = stats.total;
        this.stats.pendingPayments = stats.pending;
        this.stats.approvedPayments = stats.approved;
        this.stats.rejectedPayments = stats.rejected;
        this.stats.totalRevenue = stats.totalRevenue;
      },
      error: (error) => {
        console.error('Error loading payment stats:', error);
        this.loadMockStats();
      }
    });
  }

  loadPayments(): void {
    this.isLoading = true;
    
    const filters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      status: this.statusFilter !== 'all' ? (this.statusFilter as any) : undefined,
      search: this.searchTerm.trim() || undefined,
      sortBy: 'createdAt' as const,
      sortOrder: 'DESC' as const
    };

    this.paymentService.getPayments(filters).subscribe({
      next: (response) => {
        // Transform payments to display format
        this.payments = response.payments.map(p => this.paymentService.transformToDisplayItem(p));
        
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.pages;
        
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

  applyFilters(): void {
    // Since we're using server-side filtering, just use the loaded payments
    this.filteredPayments = [...this.payments];
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

  showDetails(payment: PaymentDisplayItem): void {
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
      next: (response) => {
        console.log('Payment approved:', response.message);
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

  rejectPayment(paymentId: string, reason?: string): void {
    this.isProcessing = true;
    
    this.paymentService.rejectPayment(paymentId, reason).subscribe({
      next: (response) => {
        console.log('Payment rejected:', response.message);
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

  get paginatedPayments(): PaymentDisplayItem[] {
    // Since we're using server-side pagination, return all filtered payments
    return this.filteredPayments;
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

  getPlanTypeLabel(planType: 'subject' | 'lesson'): string {
    return planType === 'lesson' ? 'درس' : 'مادة';
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

  trackByPayment(index: number, payment: PaymentDisplayItem): string {
    return payment.id;
  }

  // Mock fallback methods
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
    this.filteredPayments = [];
    this.totalItems = 0;
    this.totalPages = 1;
  }

  private showSuccessMessage(message: string): void {
    // Implement toast notification
    console.log('Success:', message);
  }

  private showErrorMessage(message: string): void {
    // Implement toast notification
    console.error('Error:', message);
  }
}