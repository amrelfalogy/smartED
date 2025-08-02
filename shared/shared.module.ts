import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardCarouselComponent } from './card-carousel/card-carousel.component'; 
import { CarouselModule } from 'primeng/carousel';

@NgModule({
  declarations: [
    CardCarouselComponent
  ],
  imports: [
    CommonModule,
    CarouselModule
  ],
  exports: [
    CardCarouselComponent
  ]
})
export class SharedModule { }