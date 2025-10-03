import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardCarouselComponent } from './card-carousel/card-carousel.component'; 
import { CarouselModule } from 'primeng/carousel';
import { RouterModule } from '@angular/router';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { DynamicFormArrayComponent } from './dynamic-form-array/dynamic-form-array.component';
import { HeaderComponent } from '../admin-dashboard/layouts/admin-layouts/header/header.component';
import { HeaderLeftComponent } from '../admin-dashboard/layouts/admin-layouts/header/header-left/header-left.component';
import { HeaderRightComponent } from '../admin-dashboard/layouts/admin-layouts/header/header-right/header-right.component';
import { CardComponent } from '../admin-dashboard/shared/components/card/card.component';
import { ActivationCodeInputComponent } from './activation-code-input/activation-code-input.component';
import { YoutubeSecurePlayerComponent } from './youtube-secure-player/youtube-secure-player.component';

@NgModule({
  declarations: [
    CardComponent,
    CardCarouselComponent,
    FileUploadComponent,
    VideoPlayerComponent,
    DynamicFormArrayComponent,
    HeaderComponent,
    HeaderLeftComponent,
    HeaderRightComponent,
    ActivationCodeInputComponent,
    YoutubeSecurePlayerComponent
  ],
  imports: [
    CommonModule,
    CarouselModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule  
  ],
  exports: [
    CardCarouselComponent,
    FileUploadComponent,
    VideoPlayerComponent,
    YoutubeSecurePlayerComponent,
    DynamicFormArrayComponent,
    HeaderComponent,
    HeaderLeftComponent,
    HeaderRightComponent,
    CardComponent,
    ActivationCodeInputComponent
  ]
})
export class SharedModule { }