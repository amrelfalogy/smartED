import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MyCoursesComponent } from './my-courses.component';

@NgModule({
  declarations: [
    MyCoursesComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: MyCoursesComponent }
    ])
  ]
})
export class MyCoursesModule { }