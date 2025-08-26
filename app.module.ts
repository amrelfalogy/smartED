import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { HomeComponent } from './features/home/home.component';
import { CarouselModule } from 'primeng/carousel';
import { HomeModule } from './features/home/home.module';
import { CourseCatalogComponent } from './features/courses/course-catalog/course-catalog.component';
import { CourseTypeComponent } from './features/courses/course-type/course-type.component';
import { AdminLayoutComponent } from './admin-dashboard/layouts/admin-layouts/admin-layout/admin-layout.component';
import { HeaderComponent } from './admin-dashboard/layouts/admin-layouts/header/header.component';
import { SidebarComponent } from './admin-dashboard/layouts/admin-layouts/sidebar/sidebar.component';

import { AdminDashboardModule } from './admin-dashboard/dashboard.module';
import { StudentDashboardModule } from './student-dashboard/student-dashboard.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';


@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    CourseCatalogComponent,
    CourseTypeComponent,
    AdminLayoutComponent,
    HeaderComponent,
    SidebarComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,    
    HomeModule,
    BrowserAnimationsModule,
    AdminDashboardModule,
    StudentDashboardModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
