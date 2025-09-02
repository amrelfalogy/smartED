import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CourseDetailsComponent } from './course-details.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    CourseDetailsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild([
      { 
        path: '', 
        component: CourseDetailsComponent,
        // ✅ ADD: Allow data to be passed from parent route
        data: { 
          title: 'تفاصيل الكورس',
          breadcrumb: 'التفاصيل'
        }
      }
    ])
  ]
})
export class CourseDetailsModule { }