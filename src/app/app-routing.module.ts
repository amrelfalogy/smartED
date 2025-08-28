import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Auth routes (no layout - standalone pages)
  {
    path: 'auth',
    loadChildren: () => import('./admin-dashboard/pages/authentication/auth.module').then(m => m.AuthModule)
  },

  // Admin dashboard (has its own layout)
  {
    path: 'admin',
    loadChildren: () => import('./admin-dashboard/dashboard.module').then(m => m.AdminDashboardModule),
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },

  // Student dashboard (protected routes)
  {
    path: 'student-dashboard',
    loadChildren: () => import('./student-dashboard/student-dashboard.module').then(m => m.StudentDashboardModule),
    canActivate: [AuthGuard],
    data: { role: 'student' }
  },

  // ✅ NEW: Student courses with public layout but protected access
  {
    path: 'student',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'student'  },
    children: [
      { 
        path: 'courses', 
        loadChildren: () => import('./features/courses/courses.module').then(m => m.CoursesModule)
      }
    ]
  },

  // Main application with public layout
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Public routes
      { 
        path: '', 
        loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
      },
      { 
        path: 'home', 
        loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
      },

      // Protected user routes (for public course browsing)
      { 
        path: 'courses', 
        loadChildren: () => import('./features/courses/courses.module').then(m => m.CoursesModule)
      }
    ]
  },

  // Legacy redirects
  { path: 'dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: 'admin-dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: 'courses-adminList', redirectTo: '/admin/courses', pathMatch: 'full' },
  { path: 'courses-adminForm', redirectTo: '/admin/courses/new', pathMatch: 'full' },
  
  // Student redirects
  { path: 'courses', redirectTo: '/student-dashboard/courses', pathMatch: 'full' },
  { path: 'my-courses', redirectTo: '/student-dashboard/my-courses', pathMatch: 'full' },
  { path: 'my-payments', redirectTo: '/student-dashboard/my-payments', pathMatch: 'full' },

  // Wildcard
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    scrollPositionRestoration: 'top',
    onSameUrlNavigation: 'reload',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}