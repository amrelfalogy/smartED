import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { ActivationCodeService } from 'src/app/core/services/activation-code.service';
import {
  ActivationCode,
  CodesListParams,
  CodeStats,
  CodeDetailsResponse
} from 'src/app/core/models/activation-code.model';

@Component({
  selector: 'app-activation-codes',
  templateUrl: './activation-codes.component.html',
  styleUrls: ['./activation-codes.component.scss']
})
export class ActivationCodesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  codes: ActivationCode[] = [];
  stats: CodeStats = {
    totalCodes: 0,
    activeCodes: 0,
    usedCodes: 0,
    unusedCodes: 0,
    codesByType: []
  };

  // State
  isLoading = false;
  isLoadingStats = true;
  error: string | null = null;
  success: string | null = null;

  // Search and Filters
  searchControl = new FormControl('');
  selectedContentType = '';
  selectedStatus = '';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  totalItems = 0;

  // Modals
  showGeneratorModal = false;
  showDetailsModal = false;
  selectedCode: ActivationCode | null = null;
  selectedCodeDetails: CodeDetailsResponse | null = null;

  constructor(private activationCodeService: ActivationCodeService) {}

  ngOnInit(): void {
    this.loadCodes();
    this.loadStats();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadCodes();
      });
  }

  // ✅ FIXED: Properly handle undefined parameters
  loadCodes(): void {
    this.isLoading = true;
    this.error = null;

    // ✅ Build clean parameters object without undefined values
    const params: CodesListParams = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // ✅ Only add parameters if they have actual values
    const searchValue = this.searchControl.value?.trim();
    if (searchValue && searchValue !== '') {
      params.search = searchValue;
    }

    if (this.selectedContentType && this.selectedContentType !== '' && this.selectedContentType !== 'all') {
      params.contentType = this.selectedContentType as any;
    }

    if (this.selectedStatus && this.selectedStatus !== '' && this.selectedStatus !== 'all') {
      params.isActive = this.selectedStatus === 'active';
    }

    console.log('🔍 Loading codes with params:', params);

    this.activationCodeService.getCodes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Codes loaded successfully:', response);
          this.codes = response.codes;
          this.totalPages = response.pagination.total;
          this.totalItems = response.pagination.totalItems;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Failed to load codes:', error);
          this.error = 'حدث خطأ أثناء تحميل رموز التفعيل';
          this.codes = [];
          this.isLoading = false;
        }
      });
  }

  private loadStats(): void {
    this.isLoadingStats = true;

    this.activationCodeService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          console.log('✅ Stats loaded:', stats);
          this.stats = stats;
          this.isLoadingStats = false;
        },
        error: (error) => {
          console.error('❌ Failed to load stats:', error);
          this.isLoadingStats = false;
        }
      });
  }

  // ✅ FIXED: Filter methods with proper value handling
  onContentTypeChange(type: string): void {
    console.log('📝 Content type changed to:', type);
    this.selectedContentType = type;
    this.currentPage = 1;
    this.loadCodes();
  }

  onStatusChange(status: string): void {
    console.log('📝 Status changed to:', status);
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadCodes();
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCodes();
  }

  // Modal methods
  openGeneratorModal(): void {
    this.showGeneratorModal = true;
  }

  closeGeneratorModal(): void {
    this.showGeneratorModal = false;
  }

  onCodeGenerated(code: ActivationCode): void {
    this.closeGeneratorModal();
    this.success = `تم إنشاء رمز التفعيل: ${code.code}`;
    this.loadCodes();
    this.loadStats();
    
    // Clear success message after 5 seconds
    setTimeout(() => this.success = null, 5000);
  }

  viewCodeDetails(code: ActivationCode): void {
    this.selectedCode = code;
    this.isLoading = true;

    this.activationCodeService.getCodeDetails(code.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.selectedCodeDetails = details;
          this.showDetailsModal = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load code details:', error);
          this.error = 'حدث خطأ أثناء تحميل تفاصيل الرمز';
          this.isLoading = false;
        }
      });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCode = null;
    this.selectedCodeDetails = null;
  }

  // Code actions
  toggleCodeStatus(code: ActivationCode): void {
    const newStatus = !code.isActive;
    
    this.activationCodeService.updateCode(code.id, { isActive: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCode) => {
          code.isActive = updatedCode.isActive;
          this.success = `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} الرمز بنجاح`;
          this.loadStats();
          setTimeout(() => this.success = null, 3000);
        },
        error: (error) => {
          console.error('Failed to update code status:', error);
          this.error = 'حدث خطأ أثناء تحديث حالة الرمز';
          setTimeout(() => this.error = null, 3000);
        }
      });
  }

  deleteCode(code: ActivationCode): void {
    if (!confirm(`هل أنت متأكد من حذف الرمز ${code.code}؟`)) {
      return;
    }

    this.activationCodeService.deleteCode(code.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.codes = this.codes.filter(c => c.id !== code.id);
          this.success = 'تم حذف الرمز بنجاح';
          this.loadStats();
          setTimeout(() => this.success = null, 3000);
        },
        error: (error) => {
          console.error('Failed to delete code:', error);
          this.error = 'حدث خطأ أثناء حذف الرمز';
          setTimeout(() => this.error = null, 3000);
        }
      });
  }

  // Utility methods
  getCodeStatus(code: ActivationCode) {
    return this.activationCodeService.getCodeStatusLabel(code);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  copyCodeToClipboard(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.success = 'تم نسخ الرمز إلى الحافظة';
      setTimeout(() => this.success = null, 2000);
    }).catch(() => {
      this.error = 'فشل في نسخ الرمز';
      setTimeout(() => this.error = null, 2000);
    });
  }

  getContentTypeLabel(type: string): string {
    switch (type) {
      case 'lesson': return 'درس';
      case 'subject': return 'مادة';
      case 'unit': return 'وحدة';
      default: return type;
    }
  }

  getUsagePercentage(code: ActivationCode): number {
    return code.maxUses > 0 ? (code.currentUses / code.maxUses) * 100 : 0;
  }

  trackByCodeId(index: number, code: ActivationCode): string {
    return code.id;
  }

  // Clear messages
  clearMessages(): void {
    this.error = null;
    this.success = null;
  }

  getVisiblePageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 10;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page and surrounding pages
      const startPage = Math.max(1, this.currentPage - 4);
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}