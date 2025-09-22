import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CoursesAdminListComponent } from './pages/courses-admin/courses-admin-list/courses-admin-list.component';
import { CoursesAdminFormComponent } from './pages/courses-admin/courses-admin-form/courses-admin-form.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import {ActivationCodesComponent} from './pages/activation-codes/activation-codes.component';
import { AuthGuard } from '../core/guards/auth.guard';

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
        canActivate: [AuthGuard],
        data: { title: 'لوحة التحكم', breadcrumb: 'الرئيسية',
           role: 'admin_or_support' 
        }
      },
      { 
        path: 'courses', canActivate: [AuthGuard],
        data: { 
          title: 'إدارة الدورات', breadcrumb: 'الدورات',
          role: 'admin_or_support'
        },
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
          // { 
          //   path: ':id/students', 
          //   component: CoursesAdminListComponent, // or create StudentsListComponent
          //   data: { title: 'طلاب الكورس', breadcrumb: 'الطلاب', mode: 'students' }
          // }
          
        ]
      },
      { 
        path: 'course-details/:id', 
        loadChildren: () => import('../student-dashboard/pages/course-details/course-details.module').then(m => m.CourseDetailsModule),
        data: { 
          title: 'تفاصيل الكورس', 
          breadcrumb: 'التفاصيل',
          mode: 'admin' }
          
      },
      { 
        path: 'lesson-details/:id', 
        loadChildren: () => import('../student-dashboard/pages/lesson-details/lesson-details.module').then(m => m.LessonDetailsModule),
        data: { title: 'معاينة الدرس', breadcrumb: 'معاينة الدرس', mode: 'admin' }
      },
      {
        path: 'payments',
        component: PaymentsComponent,
        canActivate: [AuthGuard],
        data: { 
          title: 'المدفوعات', 
          breadcrumb: 'المدفوعات',
          role: 'admin' // ✅ Only admin can access payments
        }
      },
      {
        path: 'activation-codes',
        component: ActivationCodesComponent,
        canActivate: [AuthGuard],
        data: { 
          title: 'رموز التفعيل', 
          breadcrumb: 'رموز التفعيل',
          role: 'admin' // ✅ Only admin can access activation codes
        }
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/users.module').then(m => m.UsersModule),
        canActivate: [AuthGuard],
        data: { 
          title: 'User Management',
          role: 'admin' // ✅ Only admin can access user management
        }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }