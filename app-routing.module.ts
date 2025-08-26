import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { CourseCatalogComponent } from './features/courses/course-catalog/course-catalog.component';
import { CourseTypeComponent } from './features/courses/course-type/course-type.component';
import { DashboardComponent } from './admin-dashboard/pages/dashboard/dashboard.component';
import { CoursesAdminListComponent } from './admin-dashboard/pages/courses-admin/courses-admin-list/courses-admin-list.component';
import { CoursesAdminFormComponent } from './admin-dashboard/pages/courses-admin/courses-admin-form/courses-admin-form.component';
import { AuthGuard } from './core/guards/auth.guard';

// Student Dashboard Components
import { StudentLayoutComponent } from './student-dashboard/layouts/student-layouts/student-layout/student-layout.component';
import { StudentDashboardComponent } from './student-dashboard/pages/dashboard/dashboard.component';
import { AllCoursesComponent } from './student-dashboard/pages/all-courses/all-courses.component';
import { CourseTypeSelectionComponent } from './student-dashboard/pages/course-type-selection/course-type-selection.component';
import { CourseDetailsComponent } from './student-dashboard/pages/course-details/course-details.component';
import { LessonDetailsComponent } from './student-dashboard/pages/lesson-details/lesson-details.component';
import { MyPaymentsComponent } from './student-dashboard/pages/my-payments/my-payments.component';
import { MyCoursesComponent } from './student-dashboard/pages/my-courses/my-courses.component';

const routes: Routes = [
  // ============ PUBLIC ROUTES ============
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },

  // ============ AUTHENTICATION ============
  {
    path: 'auth',
    loadChildren: () => import('./admin-dashboard/pages/authentication/auth.module').then(m => m.AuthModule)
  },

  // ============ PROTECTED USER ROUTES ============
  { 
    path: 'courses', 
    component: CourseCatalogComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'course-type', 
    component: CourseTypeComponent,
    canActivate: [AuthGuard]
  },

  // ============ ADMIN DASHBOARD ROUTES ============
  { 
    path: 'admin-dashboard',
    canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      // Dashboard home
      { 
        path: '', 
        component: DashboardComponent 
      },
      { 
        path: 'dashboard', 
        component: DashboardComponent 
      },
      
      // Course management
      { 
        path: 'courses', 
        component: CoursesAdminListComponent 
      },
      { 
        path: 'courses/new', 
        component: CoursesAdminFormComponent 
      },
      { 
        path: 'courses/:id/edit', 
        component: CoursesAdminFormComponent 
      },
      { 
        path: 'courses/:id/view', 
        component: CoursesAdminFormComponent,
        data: { mode: 'view' }
      },
    ]
  },

  // ============ STUDENT DASHBOARD ROUTES ============
  { 
    path: 'student-dashboard',
    component: StudentLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'student' },
    children: [
      // Dashboard home
      { 
        path: '', 
        component: StudentDashboardComponent 
      },
      { 
        path: 'dashboard', 
        component: StudentDashboardComponent 
      },
      
      // Course browsing and selection
      { 
        path: 'all-courses', 
        component: AllCoursesComponent 
      },
      { 
        path: 'course-type-selection', 
        component: CourseTypeSelectionComponent 
      },
      { 
        path: 'course-details/:id', 
        component: CourseDetailsComponent 
      },
      { 
        path: 'lesson-details/:id', 
        component: LessonDetailsComponent 
      },
      
      // My content and payments
      { 
        path: 'my-courses', 
        component: MyCoursesComponent 
      },
      { 
        path: 'my-payments', 
        component: MyPaymentsComponent 
      },
    ]
  },

  // ============ LEGACY ROUTES (for backward compatibility) ============
  { 
    path: 'dashboard', 
    redirectTo: '/admin-dashboard/dashboard',
    pathMatch: 'full'
  },
  { 
    path: 'courses-adminList', 
    redirectTo: '/admin-dashboard/courses',
    pathMatch: 'full'
  },
  { 
    path: 'courses-adminForm', 
    redirectTo: '/admin-dashboard/courses/new',
    pathMatch: 'full'
  },

  // ============ WILDCARD ROUTE ============
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Set to true for debugging
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }