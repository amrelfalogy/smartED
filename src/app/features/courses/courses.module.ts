import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoursesRoutingModule } from './courses-routing.module';
import { CourseCatalogComponent } from './course-catalog/course-catalog.component';
import { CourseTypeComponent } from './course-type/course-type.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    CourseCatalogComponent,
    CourseTypeComponent
  ],
  imports: [
    CommonModule,
    CoursesRoutingModule,
    FormsModule
  ]
})
export class CoursesModule { }