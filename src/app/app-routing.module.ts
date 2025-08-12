import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { CourseCatalogComponent } from './features/courses/course-catalog/course-catalog.component';
import { CourseTypeComponent } from './features/courses/course-type/course-type.component';
import { DashboardComponent } from './admin-dashboard/pages/dashboard/dashboard.component';
import { CoursesAdminListComponent } from './admin-dashboard/pages/courses-admin/courses-admin-list/courses-admin-list.component';
import { CoursesAdminFormComponent } from './admin-dashboard/pages/courses-admin/courses-admin-form/courses-admin-form.component';
import { AuthGuard } from './core/guards/auth.guard';

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