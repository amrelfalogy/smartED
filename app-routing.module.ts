import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { CourseCatalogComponent } from './features/courses/course-catalog/course-catalog.component';
import { DashboardComponent } from './admin-dashboard/pages/dashboard/dashboard.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'home', component: HomeComponent},
  {path: 'courses', component: CourseCatalogComponent},

  {path: 'dashboard', component: DashboardComponent}  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
