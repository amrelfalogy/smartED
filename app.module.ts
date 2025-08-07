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
import { AdminLayoutComponent } from './admin-dashboard/layouts/admin-layouts/admin-layout/admin-layout.component';
import { HeaderComponent } from './admin-dashboard/layouts/admin-layouts/header/header.component';
import { SidebarComponent } from './admin-dashboard/layouts/admin-layouts/sidebar/sidebar.component';
import { AuthLoginComponent } from './admin-dashboard/pages/authentication/auth-login/auth-login.component';
import { AuthRegisterComponent } from './admin-dashboard/pages/authentication/auth-register/auth-register.component';

import { AdminDashboardModule } from './admin-dashboard/dashboard.module';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    CourseCatalogComponent,
    AdminLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    AuthLoginComponent,
    AuthRegisterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,    
    HomeModule,
    BrowserAnimationsModule,
    AdminDashboardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
