import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts'; 

// Dashboard pages
import { DashboardComponent } from './pages/dashboard/dashboard.component';

// Chart components
import { MonthlyBarChartComponent } from './shared/apexchart/monthly-bar-chart/monthly-bar-chart.component'
import { IncomeOverviewChartComponent } from './shared/apexchart/income-overview-chart/income-overview-chart.component';
import { AnalyticsChartComponent } from './shared/apexchart/analytics-chart/analytics-chart.component';
import { SalesReportChartComponent } from './shared/apexchart/sales-report-chart/sales-report-chart.component';

// Shared components
import { CardComponent } from './shared/components/card/card.component';

@NgModule({
  declarations: [
    // Pages
    DashboardComponent,
    // Chart components
    MonthlyBarChartComponent,
    IncomeOverviewChartComponent,
    AnalyticsChartComponent,
    SalesReportChartComponent,
    // Shared components
    CardComponent
  ],
  imports: [
    CommonModule,
    NgApexchartsModule
  ],
  exports: [
    DashboardComponent
  ]
})
export class AdminDashboardModule { }