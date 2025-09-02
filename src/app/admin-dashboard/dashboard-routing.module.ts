import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CoursesAdminListComponent } from './pages/courses-admin/courses-admin-list/courses-admin-list.component';
import { CoursesAdminFormComponent } from './pages/courses-admin/courses-admin-form/courses-admin-form.component';
import { PaymentsComponent } from './pages/payments/payments.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      },
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        data: { title: 'لوحة التحكم', breadcrumb: 'الرئيسية' }
      },
      { 
        path: 'courses', 
        data: { title: 'إدارة الكورسات', breadcrumb: 'الكورسات' },
        children: [
          { 
            path: '', 
            component: CoursesAdminListComponent,
            data: { title: 'قائمة الكورسات', breadcrumb: 'القائمة' }
          },
          { 
            path: 'new', 
            component: CoursesAdminFormComponent,
            data: { title: 'كورس جديد', breadcrumb: 'إنشاء جديد', mode: 'create' }
          },
          { 
            path: ':id/edit', 
            component: CoursesAdminFormComponent,
            data: { title: 'تعديل الكورس', breadcrumb: 'تعديل', mode: 'edit' }
          },
          
        ]
      },
      { 
        path: 'course-details/:id', 
        loadChildren: () => import('../student-dashboard/pages/course-details/course-details.module').then(m => m.CourseDetailsModule),
        data: { title: 'تفاصيل الكورس', breadcrumb: 'التفاصيل', mode: 'admin' }
      },
      {
        path: 'payments',
        component: PaymentsComponent,
        data: { title: 'المدفوعات', breadcrumb: 'المدفوعات' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }