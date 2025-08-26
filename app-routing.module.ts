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
  // Public
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },

  // Auth (lazy loaded)
  {
    path: 'auth',
    loadChildren: () => import('./admin-dashboard/pages/authentication/auth.module').then(m => m.AuthModule)
  },

  // Protected user routes
  { path: 'courses', component: CourseCatalogComponent, canActivate: [AuthGuard] },
  { path: 'course-type', component: CourseTypeComponent, canActivate: [AuthGuard] },

  // Admin dashboard (role-protected)
  {
    path: 'admin-dashboard',
    canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'courses', component: CoursesAdminListComponent },
      { path: 'courses/new', component: CoursesAdminFormComponent },
      { path: 'courses/:id/edit', component: CoursesAdminFormComponent },
      { path: 'courses/:id/view', component: CoursesAdminFormComponent, data: { mode: 'view' } }
    ]
  },

  // Legacy redirect
  { path: 'dashboard', redirectTo: '/admin-dashboard/dashboard', pathMatch: 'full' },
  { path: 'courses-adminList', redirectTo: '/admin-dashboard/courses', pathMatch: 'full' },
  { path: 'courses-adminForm', redirectTo: '/admin-dashboard/courses/new', pathMatch: 'full' },

  // Wildcard
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}