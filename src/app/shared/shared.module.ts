import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardCarouselComponent } from './card-carousel/card-carousel.component'; 
import { CarouselModule } from 'primeng/carousel';
import { RouterModule } from '@angular/router';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { DynamicFormArrayComponent } from './dynamic-form-array/dynamic-form-array.component';
import { HeaderComponent } from '../admin-dashboard/layouts/admin-layouts/header/header.component';
import { HeaderLeftComponent } from '../admin-dashboard/layouts/admin-layouts/header/header-left/header-left.component';
import { HeaderRightComponent } from '../admin-dashboard/layouts/admin-layouts/header/header-right/header-right.component';

@NgModule({
  declarations: [
    CardCarouselComponent,
    FileUploadComponent,
    VideoPlayerComponent,
    DynamicFormArrayComponent,
    HeaderComponent,
    HeaderLeftComponent,
    HeaderRightComponent
  ],
  imports: [
    CommonModule,
    CarouselModule,
    RouterModule  
  ],
  exports: [
    CardCarouselComponent,
    FileUploadComponent,
    VideoPlayerComponent,
    DynamicFormArrayComponent,
    HeaderComponent,
    HeaderLeftComponent,
    HeaderRightComponent,
  ]
})
export class SharedModule { }