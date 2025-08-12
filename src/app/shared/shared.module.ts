import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardCarouselComponent } from './card-carousel/card-carousel.component'; 
import { CarouselModule } from 'primeng/carousel';
import { RouterModule } from '@angular/router';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { DynamicFormArrayComponent } from './dynamic-form-array/dynamic-form-array.component';

@NgModule({
  declarations: [
    CardCarouselComponent,
    FileUploadComponent,
    VideoPlayerComponent,
    DynamicFormArrayComponent
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