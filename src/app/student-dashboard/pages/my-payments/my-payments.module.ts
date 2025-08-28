import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MyPaymentsComponent } from './my-payments.component';

@NgModule({
  declarations: [
    MyPaymentsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,  // ✅ This fixes the formGroup error
    FormsModule,
    RouterModule.forChild([
      { path: '', component: MyPaymentsComponent }
    ])
  ]
})
export class MyPaymentsModule { }