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
import { LessonService } from 'src/app/core/services/lesson.service';

@Component({
  selector: 'app-activation-codes',
  templateUrl: './activation-codes.component.html',
  styleUrls: ['./activation-codes.component.scss']
})
export class ActivationCodesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  lessonTitles = new Map<string, string>();
  isLoadingLessonTitles = false;

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

  constructor(
    private activationCodeService: ActivationCodeService,
    private lessonService: LessonService
  ) {}

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
    

    this.activationCodeService.getCodes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {          
          this.codes = response.codes;
          // Client-side filtering for lesson names
          if (searchValue) {
            this.codes = this.codes.filter(code => {
              const lessonTitle = this.lessonTitles.get(code.lessonId ?? '') || '';
              return code.code.includes(searchValue) || lessonTitle.includes(searchValue);
            });
          }
          this.totalPages = response.pagination.total;
          this.totalItems = response.pagination.totalItems;
          this.isLoading = false;
          this.fetchLessonTitles();
        },
        error: (error) => {
          console.error('❌ Failed to load codes:', error);
          this.error = 'حدث خطأ أثناء تحميل رموز التفعيل';
          this.codes = [];
          this.isLoading = false;
        }
      });
  }

  fetchLessonTitles(): void {
    this.isLoadingLessonTitles = true;
    const lessonIds = Array.from(
      new Set(
        this.codes
          .filter(c => c.contentType === 'lesson' && typeof c.lessonId === 'string' && c.lessonId)
          .map(c => c.lessonId as string)
      )
    );
    if (lessonIds.length === 0) {
      this.isLoadingLessonTitles = false;
      return;
    }
    // Fetch all lesson titles in parallel
    Promise.all(
      lessonIds.map(id =>
        this.lessonService.getLessonById(id).toPromise()
          .then(lesson => this.lessonTitles.set(id, lesson?.title || 'غير متاح'))
          .catch(() => this.lessonTitles.set(id, 'غير متاح'))
      )
    ).finally(() => {
      this.isLoadingLessonTitles = false;
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

  
 // ✅ Add this method to handle multiple codes generation
  onCodesGenerated(codes: ActivationCode[]): void {
    console.log('✅ Multiple codes generated:', codes);
    
    // Set success message
    this.success = `تم إنشاء ${codes.length} رمز تفعيل بنجاح`;
    
    // Close modal
    this.showGeneratorModal = false;
    
    // Reload codes list to show new codes
    this.loadCodes();
    
    // Clear success message after delay
    setTimeout(() => {
      this.success = null;
    }, 5000);
  }

  // ✅ Update existing onCodeGenerated method
  onCodeGenerated(code: ActivationCode): void {
    console.log('✅ Single code generated:', code);
    
    // Set success message
    this.success = 'تم إنشاء رمز التفعيل بنجاح';
    
    // Close modal
    this.showGeneratorModal = false;
    
    // Reload codes list
    this.loadCodes();
    
    // Clear success message after delay
    setTimeout(() => {
      this.success = null;
    }, 5000);
  }

  // ✅ NEW: Copy all codes for a specific lesson
  copyAllCodesForLesson(lessonId: string): void {
    if (!lessonId) return;

    // Filter codes for this lesson
    const lessonCodes = this.codes.filter(code => code.lessonId === lessonId);
    
    if (lessonCodes.length === 0) {
      this.error = 'لا توجد رموز لهذا الدرس';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    // Create formatted text with all codes
    const codesText = lessonCodes
      .map((code, index) => `${index + 1}. ${code.code}`)
      .join('\n');

    const lessonTitle = this.lessonTitles.get(lessonId) || 'الدرس';
    const fullText = `رموز التفعيل للدرس: ${lessonTitle}\n\n${codesText}`;

    navigator.clipboard.writeText(fullText).then(() => {
      this.success = `تم نسخ ${lessonCodes.length} رمز تفعيل للدرس`;
      setTimeout(() => this.success = null, 3000);
    }).catch(() => {
      this.error = 'فشل في نسخ الرموز';
      setTimeout(() => this.error = null, 3000);
    });
  }

  // ✅ Update getVisiblePageNumbers method (fix the pagination issue)
  getVisiblePageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Show 2 pages on each side of current page
    
    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);
    
    // Ensure we always show at least 5 pages if possible
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }
    
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}