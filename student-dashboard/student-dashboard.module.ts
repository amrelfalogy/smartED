import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Layout components
import { StudentLayoutComponent } from './layouts/student-layouts/student-layout/student-layout.component';
import { StudentHeaderComponent } from './layouts/student-layouts/header/header.component';
import { StudentSidebarComponent } from './layouts/student-layouts/sidebar/sidebar.component';

// Page components
import { StudentDashboardComponent } from './pages/dashboard/dashboard.component';
import { AllCoursesComponent } from './pages/all-courses/all-courses.component';
import { CourseTypeSelectionComponent } from './pages/course-type-selection/course-type-selection.component';
import { CourseDetailsComponent } from './pages/course-details/course-details.component';
import { LessonDetailsComponent } from './pages/lesson-details/lesson-details.component';
import { MyPaymentsComponent } from './pages/my-payments/my-payments.component';
import { MyCoursesComponent } from './pages/my-courses/my-courses.component';

@NgModule({
  declarations: [
    // Layout components
    StudentLayoutComponent,
    StudentHeaderComponent,
    StudentSidebarComponent,
    
    // Page components
    StudentDashboardComponent,
    AllCoursesComponent,
    CourseTypeSelectionComponent,
    CourseDetailsComponent,
    LessonDetailsComponent,
    MyPaymentsComponent,
    MyCoursesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    StudentLayoutComponent,
    StudentDashboardComponent
  ]
})
export class StudentDashboardModule { }