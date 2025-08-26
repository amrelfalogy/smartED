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
import { CoursesAdminListComponent } from './pages/courses-admin/courses-admin-list/courses-admin-list.component';
import { CoursesAdminFormComponent } from './pages/courses-admin/courses-admin-form/courses-admin-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SubjectSectionComponent } from './pages/courses-admin/courses-admin-form/components/subject-section/subject-section.component';
import { UnitsSectionComponent } from './pages/courses-admin/courses-admin-form/components/units-section/units-section.component';
import { LessonsSectionComponent } from './pages/courses-admin/courses-admin-form/components/lessons-section/lessons-section.component';

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
    CardComponent,
    CoursesAdminListComponent,
    CoursesAdminFormComponent,
    SubjectSectionComponent,
    UnitsSectionComponent,
    LessonsSectionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule
  ],
  exports: [
    DashboardComponent
  ]
})
export class AdminDashboardModule { }