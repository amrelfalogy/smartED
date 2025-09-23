// ✅ UPDATE: dashboard.component.ts - Fix payment service integration
import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, expand, reduce, takeWhile } from 'rxjs/operators';

import { PaymentService } from 'src/app/core/services/payment.service';
import { UserService } from 'src/app/core/services/user.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

interface KpiCard {
  title: string;
  amount: string | number;
  background: string;
  border: string;
  icon: string; 
  iconColor: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // KPIs
  kpis: KpiCard[] = [];

  // Recent payments - ✅ UPDATE: Use new structure
  recentPayments: Array<{
    id: string;
    student: string;
    status: 'pending' | 'approved' | 'rejected';
    planType: string;
    method: string;
    amount: string;
    createdAt: string;
  }> = [];
  isLoadingPayments = false;

  // Recent users
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    isActive: boolean;
  }> = [];
  isLoadingUsers = false;

  // Charts data (bind to Apex charts)
  // Monthly/Weekly revenue
  weekCategories: string[] = [];
  weekRevenue: number[] = [];
  monthCategories: string[] = [];
  monthRevenue: number[] = [];

  // Payments by method
  byMethodLabels: string[] = [];
  byMethodRevenue: number[] = [];

  // Plan type breakdown
  planTypeLabels: string[] = [];
  planTypeRevenue: number[] = [];
  planTypeCounts: number[] = [];

  // Users analytics
  registrationCategories: string[] = [];
  registrationData: number[] = [];

  constructor(
    private paymentService: PaymentService,
    private userService: UserService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.fixApexChartsPassiveEvents();

    this.loadKpis();
    this.loadRecentPayments();
    this.loadRecentUsers();
    this.loadChartData();
  }

  private fixApexChartsPassiveEvents(): void {
    // Override wheel event handling for ApexCharts
    const originalAddEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(type: string, listener: any, options?: any) {
      if (type === 'wheel' && this.classList?.contains('apexcharts-canvas')) {
        // Force passive: false for ApexCharts wheel events
        options = { ...(options || {}), passive: false };
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // ✅ UPDATE: Fix KPIs loading with new payment service
  private loadKpis(): void {
    forkJoin({
      paymentStats: this.paymentService.getPaymentStatsOverview().pipe(catchError(() => of({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        revenue: 0,
        totalRevenue: 0
      }))),
      userStats: this.userService.getUserStats().pipe(catchError(() => of({
        totalUsers: 0,
        activeUsers: 0,
        totalStudents: 0,
        totalTeachers: 0
      }))),
      // Try analytics service if available
      dashboard: this.analyticsService.getAdminDashboardOverview().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ paymentStats, userStats, dashboard }) => {
        const totalUsers = userStats?.totalUsers ?? dashboard?.users?.total ?? 0;
        const activeUsers = userStats?.activeUsers ?? 0;
        const subjects = dashboard?.content?.subjects ?? 0;
        const revenue = paymentStats?.totalRevenue ?? 0;

        this.kpis = [
          { 
            title: 'إجمالي المستخدمين', 
            amount: totalUsers.toLocaleString(), 
            background: 'bg-primary', 
            border: 'border-primary', 
            icon: 'pi-users', 
            iconColor: 'text-primary'  
          },
          { 
            title: 'المستخدمون النشطون', 
            amount: activeUsers.toLocaleString(), 
            background: 'bg-warning', 
            border: 'border-warning', 
            icon: 'pi-user-plus', 
            iconColor: 'text-warning'  
          },
          { 
            title: 'عدد المواد', 
            amount: subjects.toLocaleString(), 
            background: 'bg-info', 
            border: 'border-info', 
            icon: 'pi-book', 
            iconColor: 'text-info'  
          },
          { 
            title: 'الإيرادات (جنيه)', 
            amount: this.formatEGP(revenue), 
            background: 'bg-success', 
            border: 'border-success', 
            icon: 'pi-wallet', 
            iconColor: 'text-success'  
          }
        ];
      },
      error: (err) => {
        console.error('Failed to load KPIs', err);
        this.loadFallbackKpis();
      }
    });
  }

  // ✅ UPDATE: Fix chart data loading
  loadChartData(): void {
    forkJoin({
      paymentStats: this.paymentService.getPaymentStats().pipe(catchError(() => of({ stats: [], totalRevenue: 0 }))),
      usersAnalytics: this.analyticsService.getUsersAnalytics().pipe(catchError(() => of({ 
        usersByRole: [], 
        registrationTrend: [] 
      })))
    }).subscribe({
      next: ({ paymentStats, usersAnalytics }) => {
        // ✅ UPDATE: Process payment stats for charts
        this.processPaymentStats(paymentStats);
        
        // Users registration trend
        const trend = (usersAnalytics.registrationTrend || []).sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.registrationCategories = trend.map((t: any) => this.formatShortDate(t.date));
        this.registrationData = trend.map((t: any) => t.count);

        // Build revenue series for week and month
        this.buildRevenueSeries(30);
      },
      error: (err) => {
        console.error('Failed to load charts overview', err);
        this.setFallbackChartData();
        this.buildRevenueSeries(30);
      }
    });
  }

  // ✅ NEW: Process payment stats from new API structure
  private processPaymentStats(paymentStats: any): void {
    const stats = paymentStats.stats || [];
    
    // Group by status for method analysis (mock data since API doesn't provide method breakdown)
    const methodData = this.generateMethodData(stats);
    this.byMethodLabels = methodData.map(m => m.method);
    this.byMethodRevenue = methodData.map(m => m.revenue);

    // Plan types (subject vs lesson - mock data since API doesn't distinguish)
    const planTypeData = this.generatePlanTypeData(stats);
    this.planTypeLabels = planTypeData.map(t => t.type);
    this.planTypeRevenue = planTypeData.map(t => t.revenue);
    this.planTypeCounts = planTypeData.map(t => t.count);
  }

  // ✅ NEW: Generate method breakdown (mock until API provides this)
  private generateMethodData(stats: any[]): Array<{method: string, revenue: number}> {
    const totalRevenue = stats.reduce((sum, stat) => sum + Number(stat.total || 0), 0);
    
    return [
      { method: 'كاش', revenue: Math.floor(totalRevenue * 0.4) },
      { method: 'InstaPay', revenue: Math.floor(totalRevenue * 0.3) },
      { method: 'فودافون كاش', revenue: Math.floor(totalRevenue * 0.2) },
      { method: 'تحويل بنكي', revenue: Math.floor(totalRevenue * 0.1) }
    ].filter(item => item.revenue > 0);
  }

  // ✅ NEW: Generate plan type breakdown (mock until API provides this)
  private generatePlanTypeData(stats: any[]): Array<{type: string, revenue: number, count: number}> {
    const totalRevenue = stats.reduce((sum, stat) => sum + Number(stat.total || 0), 0);
    const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
    
    return [
      { 
        type: 'مادة كاملة', 
        revenue: Math.floor(totalRevenue * 0.7), 
        count: Math.floor(totalCount * 0.6) 
      },
      { 
        type: 'درس منفرد', 
        revenue: Math.floor(totalRevenue * 0.3), 
        count: Math.floor(totalCount * 0.4) 
      }
    ].filter(item => item.revenue > 0 || item.count > 0);
  }

  // ✅ UPDATE: Fix recent payments loading with new API structure
  private loadRecentPayments(): void {
    this.isLoadingPayments = true;
    this.paymentService.getPayments({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'DESC' }).subscribe({
      next: (res) => {
        if (!res || !Array.isArray(res.payments)) {
          this.recentPayments = [];
          this.isLoadingPayments = false;
          return;
        }
        
        this.recentPayments = res.payments.map((p) => ({
          id: p.id.substring(0, 8) + '...',
          student: p.student ? `${p.student.firstName} ${p.student.lastName}`.trim() : 'غير محدد',
          status: p.status as 'pending' | 'approved' | 'rejected',
          planType: p.subjectId ? 'مادة' : p.lessonId ? 'درس' : 'غير محدد',
          method: this.translatePaymentMethod(p.paymentMethod),
          amount: this.formatEGP(Number(p.amount) || 0),
          createdAt: this.formatShortDate(p.createdAt)
        }));
        
        this.isLoadingPayments = false;
      },
      error: (err) => {
        console.error('Error loading recent payments:', err);
        this.recentPayments = [];
        this.isLoadingPayments = false;
      }
    });
  }

  // ✅ UPDATE: Fix recent users loading
  private loadRecentUsers(): void {
    this.isLoadingUsers = true;
    this.userService.getUsers({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }).subscribe({
      next: (res) => {
        if (!res || !Array.isArray(res.users)) {
          this.recentUsers = [];
          this.isLoadingUsers = false;
          return;
        }
        
        this.recentUsers = res.users.map((u) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'غير محدد',
          email: u.email || 'N/A',
          role: this.translateRole(u.role),
          createdAt: this.formatShortDate(u.createdAt),
          isActive: u.isActive || false
        }));
        
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Error loading recent users:', err);
        this.recentUsers = [];
        this.isLoadingUsers = false;
      }
    });
  }

  // ✅ UPDATE: Fix revenue series building with new API structure
  private buildRevenueSeries(days: number): void {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    // Pre-init totals map and ordered keys
    const dayKeys: string[] = [];
    const dayTotals = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayKeys.push(key);
      dayTotals.set(key, 0);
    }

    const pageSize = 100;
    let page = 1;

    const fetchPage = (p: number) =>
      this.paymentService.getPayments({ page: p, limit: pageSize, status: 'approved' });

    fetchPage(page).pipe(
      expand((res) => {
        if (!res || !res.pagination) return of(null);
        
        const pagination = res.pagination;
        const totalPages = pagination.pages || 1;
        page += 1;
        return page <= totalPages ? fetchPage(page) : of(null);
      }),
      takeWhile((res) => res !== null),
      reduce((acc: Map<string, number>, res) => {
        if (!res || !Array.isArray(res.payments)) return acc;
        
        res.payments.forEach((p) => {
          if (p && p.createdAt) {
            try {
              const createdAt = new Date(p.createdAt);
              if (!isNaN(createdAt.getTime()) && createdAt >= start && createdAt <= end) {
                const key = createdAt.toISOString().slice(0, 10);
                const amt = Number(p.amount) || 0;
                acc.set(key, (acc.get(key) || 0) + amt);
              }
            } catch (error) {
              console.warn('Error processing payment date:', error, p);
            }
          }
        });
        return acc;
      }, dayTotals)
    ).subscribe({
      next: (totals: Map<string, number>) => {
        const categories = dayKeys.map(k => this.formatDayLabel(k));
        const series = dayKeys.map(k => totals.get(k) || 0);

        this.monthCategories = categories;
        this.monthRevenue = series;

        const last7Idx = Math.max(0, categories.length - 7);
        this.weekCategories = categories.slice(last7Idx);
        this.weekRevenue = series.slice(last7Idx);
      },
      error: (err) => {
        console.error('Failed to build revenue series', err);
        this.setFallbackRevenueData();
      }
    });
  }

  // ✅ NEW: Helper methods
  private translatePaymentMethod(method: string): string {
    const translations: Record<string, string> = {
      'cash': 'كاش',
      'instapay': 'InstaPay',
      'vodafone_cash': 'فودافون كاش',
      'bank_transfer': 'تحويل بنكي'
    };
    return translations[method] || method;
  }

  private translateRole(role: string): string {
    const translations: Record<string, string> = {
      'student': 'طالب',
      'teacher': 'معلم',
      'admin': 'مدير',
      'support': 'دعم فني'
    };
    return translations[role] || role;
  }

  // ✅ NEW: Fallback methods
  private loadFallbackKpis(): void {
    this.kpis = [
      { title: 'إجمالي المستخدمين', amount: '0', background: 'bg-primary', border: 'border-primary', icon: 'pi-users', iconColor: 'text-primary' },
      { title: 'المستخدمون النشطون', amount: '0', background: 'bg-warning', border: 'border-warning', icon: 'pi-user-plus', iconColor: 'text-warning' },
      { title: 'عدد المواد', amount: '0', background: 'bg-info', border: 'border-info', icon: 'pi-book', iconColor: 'text-info' },
      { title: 'الإيرادات (جنيه)', amount: '0 جنيه', background: 'bg-success', border: 'border-success', icon: 'pi-wallet', iconColor: 'text-success' }
    ];
  }

  private setFallbackChartData(): void {
    this.byMethodLabels = ['كاش', 'InstaPay'];
    this.byMethodRevenue = [0, 0];
    this.planTypeLabels = ['مادة', 'درس'];
    this.planTypeRevenue = [0, 0];
    this.planTypeCounts = [0, 0];
    this.registrationCategories = ['هذا الأسبوع'];
    this.registrationData = [0];
  }

  private setFallbackRevenueData(): void {
    const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    this.weekCategories = days;
    this.weekRevenue = new Array(7).fill(0);
    this.monthCategories = days.concat(new Array(23).fill('').map((_, i) => `يوم ${i + 8}`));
    this.monthRevenue = new Array(30).fill(0);
  }

  // Utils (keep existing)
  private formatEGP(amount: number): string {
    return `${amount.toLocaleString('en-US')} جنيه`;
  }
  
  private formatShortDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  private formatDayLabel(yyyyMmDd: string): string {
    const d = new Date(yyyyMmDd + 'T00:00:00Z');
    const day = d.getUTCDate().toString().padStart(2, '0');
    const monthShort = d.toLocaleString('ar-EG', { month: 'short', timeZone: 'UTC' });
    return `${day} ${monthShort}`;
  }

  // TrackBys (keep existing)
  trackByKpi(i: number, k: KpiCard) { return k.title || i; }
  trackByPayment(i: number, p: any) { return p.id || i; }
  trackByUser(i: number, u: any) { return u.id || i; }
}