import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LessonDetailsComponent } from './lesson-details.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [LessonDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: LessonDetailsComponent,
        data: { title: 'تفاصيل الدرس' }
      }
    ])
  ]
})
export class LessonDetailsModule {}