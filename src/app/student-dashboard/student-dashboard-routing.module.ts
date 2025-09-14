import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentLayoutComponent } from './student-layouts/student-layout/student-layout.component';

const routes: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      { 
        path: '', 
        redirectTo: 'my-courses', 
        pathMatch: 'full' 
      },
      { 
        path: 'my-courses', 
        loadChildren: () => import('./pages/my-courses/my-courses.module').then(m => m.MyCoursesModule)
      },
      { 
        path: 'my-payments', 
        loadChildren: () => import('./pages/my-payments/my-payments.module').then(m => m.MyPaymentsModule)
      },
      { 
        path: 'course-details/:id', 
        loadChildren: () => import('./pages/course-details/course-details.module').then(m => m.CourseDetailsModule)
      },
       // Updated: expose "courses" inside student-dashboard shell
      {
        path: 'courses',
        loadChildren: () => import('../features/courses/courses.module').then(m => m.CoursesModule)
      },

      // Legacy alias (optional): keep if any old links still point here
      {
        path: 'student/all-courses',
        loadChildren: () => import('../features/courses/courses.module').then(m => m.CoursesModule)
      },

      { 
        path: 'lesson-details/:id', 
        loadChildren: () => import('./pages/lesson-details/lesson-details.module').then(m => m.LessonDetailsModule)
      }
      // { 
      //   path: 'progress', 
      //   loadChildren: () => import('./pages/progress/progress.module').then(m => m.ProgressModule)
      // },
      // { 
      //   path: 'payment-history', 
      //   loadChildren: () => import('./pages/payment-history/payment-history.module').then(m => m.PaymentHistoryModule)
      // },
      // { 
      //   path: 'profile', 
      //   loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule)
      // }
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentDashboardRoutingModule { }