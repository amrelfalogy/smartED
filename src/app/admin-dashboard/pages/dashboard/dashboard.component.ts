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

  // Recent payments
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
    this.loadKpis();
    this.loadRecentPayments();
    this.loadRecentUsers();
    this.loadChartData();
  }

  // KPIs from /analytics/dashboard (+ fallback to payments overview for revenue)
  private loadKpis(): void {
    forkJoin({
      dashboard: this.analyticsService.getAdminDashboardOverview().pipe(catchError(() => of(null))),
      usersOverview: this.userService.getUsersStatsOverview().pipe(catchError(() => of(null))),
      paymentsOverview: this.paymentService.getPaymentStatsOverview().pipe(catchError(() => of({ totalRevenue: 0 } as any)))
    }).subscribe({
      next: ({ dashboard, usersOverview, paymentsOverview }) => {
        const totalUsers = usersOverview?.totalUsers ?? dashboard?.users?.total ?? 0;
        const activeUsers = usersOverview?.activeUsers ?? 0;
        const subjects = dashboard?.content?.subjects ?? 0;
        const revenue = dashboard?.payments?.total?.amount ?? paymentsOverview?.totalRevenue ?? 0;

        this.kpis = [
          { title: 'إجمالي المستخدمين', amount: totalUsers, background: 'bg-primary', border: 'border-primary', icon: 'pi-users', iconColor: 'text-primary'  },
          { title: 'المستخدمون النشطون', amount: activeUsers, background: 'bg-warning', border: 'border-warning', icon: 'pi-user-plus', iconColor: 'text-warning'  },
          { title: 'عدد المواد', amount: subjects, background: 'bg-info', border: 'border-info', icon: 'pi-book', iconColor: 'text-info'  },
          { title: 'الإيرادات (جنيه)', amount: this.formatEGP(revenue), background: 'bg-success', border: 'border-success', icon: 'pi-wallet', iconColor: 'text-success'  }
        ];
      },
      error: (err) => {
        console.error('Failed to load KPIs', err);
        this.kpis = [];
      }
    });
  }

  // Charts: overview + users analytics + time series
  loadChartData(): void {
    forkJoin({
      paymentsOverview: this.paymentService.getPaymentStatsOverview().pipe(catchError(() => of({ byMethod: [], stats: [] } as any))),
      usersAnalytics: this.analyticsService.getUsersAnalytics().pipe(catchError(() => of({ usersByRole: [], registrationTrend: [] } as any)))
    }).subscribe({
      next: ({ paymentsOverview, usersAnalytics }) => {
        // Payments by method
        const byMethod = paymentsOverview.byMethod || [];
        this.byMethodLabels = byMethod.map((m: any) => m.method);
        this.byMethodRevenue = byMethod.map((m: any) => (typeof m.revenue === 'number' ? m.revenue : (m.count || 0)));

        // Plan types
        const byType = paymentsOverview.stats || [];
        this.planTypeLabels = byType.map((t: any) => t.planType);
        this.planTypeRevenue = byType.map((t: any) => (typeof t.revenue === 'number' ? t.revenue : (t.count || 0)));
        this.planTypeCounts = byType.map((t: any) => t.count || 0);

        // Users registration trend
        const trend = (usersAnalytics.registrationTrend || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.registrationCategories = trend.map((t: any) => this.formatShortDate(t.date));
        this.registrationData = trend.map((t: any) => t.count);

        // Build revenue series for week and month
        this.buildRevenueSeries(30);
      },
      error: (err) => {
        console.error('Failed to load charts overview', err);
        // Still attempt time series
        this.buildRevenueSeries(30);
      }
    });
  }

  // Fetch approved payments and aggregate by day for last N days
  private buildRevenueSeries(days: number): void {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    // Pre-init totals map and ordered keys
    const dayKeys: string[] = [];
    const dayTotals = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayKeys.push(key);
      dayTotals.set(key, 0);
    }

    const pageSize = 100;
    let page = 1;

    const fetchPage = (p: number) =>
      this.paymentService.getPayments({ page: p, limit: pageSize, status: 'approved' });

    fetchPage(page).pipe(
      expand((res: any) => {
        const pagination = res?.pagination || res?.data?.pagination || {};
        const totalPages = pagination.pages || Math.ceil((pagination.total || 0) / pageSize) || 0;
        page += 1;
        return page <= totalPages ? fetchPage(page) : of(null);
      }),
      takeWhile((res) => res !== null),
      // Accumulate into the provided seed (dayTotals) across pages
      reduce((acc: Map<string, number>, res: any) => {
        const rows = (res as any).payments || res?.data?.payments || [];
        rows.forEach((p: any) => {
          const createdAt = new Date(p.createdAt);
          if (createdAt >= start && createdAt <= end) {
            const key = createdAt.toISOString().slice(0, 10);
            const amt = Number(p.amount ?? (p.amount_cents ? p.amount_cents / 100 : 0)) || 0;
            acc.set(key, (acc.get(key) || 0) + amt);
          }
        });
        return acc;
      }, dayTotals)
    ).subscribe({
      next: (totals: Map<string, number>) => {
        const categories = dayKeys.map(k => this.formatDayLabel(k));
        const series = dayKeys.map(k => totals.get(k) || 0);

        // Month (30 days)
        this.monthCategories = categories;
        this.monthRevenue = series;

        // Week (last 7 days)
        const last7Idx = Math.max(0, categories.length - 7);
        this.weekCategories = categories.slice(last7Idx);
        this.weekRevenue = series.slice(last7Idx);
      },
      error: (err) => {
        console.error('Failed to build revenue series', err);
        this.weekCategories = [];
        this.weekRevenue = [];
        this.monthCategories = [];
        this.monthRevenue = [];
      }
    });
  }

  // Recent payments (top 10)
  private loadRecentPayments(): void {
    this.isLoadingPayments = true;
    this.paymentService.getPayments({ page: 1, limit: 10 }).subscribe({
      next: (res: any) => {
        const list = res.payments || res.data?.payments || [];
        this.recentPayments = list.map((p: any) => ({
          id: p.id,
          student: p.student?.firstName ? `${p.student.firstName} ${p.student.lastName || ''}`.trim() : (p.studentName || '—'),
          status: p.status,
          planType: p.plan?.type || p.planType || '—',
          method: p.paymentMethod || p.method || '—',
          amount: this.formatEGP(Number(p.amount ?? (p.amount_cents ? p.amount_cents / 100 : 0)) || 0),
          createdAt: this.formatShortDate(p.createdAt)
        }));
        this.isLoadingPayments = false;
      },
      error: () => {
        this.recentPayments = [];
        this.isLoadingPayments = false;
      }
    });
  }

  // Recent users (top 10)
  private loadRecentUsers(): void {
    this.isLoadingUsers = true;
    this.userService.getUsers({ page: 1, limit: 10 }).subscribe({
      next: (res) => {
        const users = (res as any).users || [];
        this.recentUsers = users.map((u: any) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          email: u.email,
          role: u.role,
          createdAt: this.formatShortDate(u.createdAt),
          isActive: u.isActive
        }));
        this.isLoadingUsers = false;
      },
      error: () => {
        this.recentUsers = [];
        this.isLoadingUsers = false;
      }
    });
  }

  // Utils
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

  // TrackBys
  trackByKpi(i: number, k: KpiCard) { return k.title || i; }
  trackByPayment(i: number, p: any) { return p.id || i; }
  trackByUser(i: number, u: any) { return u.id || i; }
}