import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { HomeComponent } from './features/home/home.component';
import { CarouselModule } from 'primeng/carousel';
import { HomeModule } from './features/home/home.module';
import { CourseCatalogComponent } from './features/courses/course-catalog/course-catalog.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    CourseCatalogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,    
    HomeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
