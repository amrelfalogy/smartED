import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { StudentDashboardRoutingModule } from './student-dashboard-routing.module';
import { StudentLayoutComponent } from './student-layouts/student-layout/student-layout.component';

import { SidebarModule } from '../admin-dashboard/layouts/admin-layouts/sidebar/sidebar.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    StudentLayoutComponent,
   
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    StudentDashboardRoutingModule,
    SharedModule,
    SidebarModule
  ]
})
export class StudentDashboardModule { }