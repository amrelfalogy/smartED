import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SupportRoutingModule } from './support-routing.module';
import { SupportComponent } from './support.component';

@NgModule({
  declarations: [SupportComponent],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SupportRoutingModule]
})
export class SupportModule {}