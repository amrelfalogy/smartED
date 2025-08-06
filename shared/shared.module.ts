import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardCarouselComponent } from './card-carousel/card-carousel.component'; 
import { CarouselModule } from 'primeng/carousel';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    CardCarouselComponent
  ],
  imports: [
    CommonModule,
    CarouselModule,
    RouterModule  
  ],
  exports: [
    CardCarouselComponent
  ]
})
export class SharedModule { }