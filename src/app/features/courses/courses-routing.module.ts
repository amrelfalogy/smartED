import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourseCatalogComponent } from './course-catalog/course-catalog.component';
import { CourseTypeComponent } from './course-type/course-type.component';

const routes: Routes = [
  { path: '', component: CourseCatalogComponent },
  { path: 'catalog', component: CourseCatalogComponent },
  { path: 'type', component: CourseTypeComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoursesRoutingModule { }