import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Shared Components
import { SharedModule } from 'src/app/shared/shared.module';

// User Components
import { StudentsComponent } from './students/students.component';
import { TeachersComponent } from './teachers/teachers.component';
import { SupportComponent } from './support/support.component';

// Shared User Components
import { UserProfileModalComponent } from './shared/user-profile-modal/user-profile-modal.component';

// Routes
import { Routes } from '@angular/router';
import { ProfilePictureUploadComponent } from './shared/profile-picture-upload/profile-picture-upload.component';

const routes: Routes = [
  {
    path: 'students',
    component: StudentsComponent,
    data: { title: 'إدارة الطلاب' }
  },
  {
    path: 'teachers', 
    component: TeachersComponent,
    data: { title: 'إدارة المعلمين' }
  },
  {
    path: 'support',
    component: SupportComponent, 
    data: { title: 'إدارة فريق الدعم' }
  },
  {
    path: '',
    redirectTo: 'students',
    pathMatch: 'full' as const
  }
];

@NgModule({
  declarations: [
    StudentsComponent,
    TeachersComponent,
    SupportComponent,
    UserProfileModalComponent,
    ProfilePictureUploadComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    StudentsComponent,
    TeachersComponent,
    SupportComponent,
    UserProfileModalComponent,
    ProfilePictureUploadComponent

  ]
})
export class UsersModule { }