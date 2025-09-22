import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MyPaymentsComponent } from './my-payments.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    MyPaymentsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    FormsModule,
    SharedModule,
    RouterModule.forChild([
      { path: '', component: MyPaymentsComponent }
    ])
  ]
})
export class MyPaymentsModule { }