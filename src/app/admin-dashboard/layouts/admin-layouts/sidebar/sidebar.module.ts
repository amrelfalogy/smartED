import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SidebarComponent } from './sidebar.component';
import { SidebarContentComponent } from './sidebar-content/sidebar-content.component';
import { SidebarGroupComponent } from './sidebar-content/sidebar-group/sidebar-group.component';
import { SidebarCollapseComponent } from './sidebar-content/sidebar-collapse/sidebar-collapse.component';
import { SidebarItemComponent } from './sidebar-content/sidebar-item/sidebar-item.component';

@NgModule({
  declarations: [
    SidebarComponent,
    SidebarContentComponent,
    SidebarGroupComponent,
    SidebarCollapseComponent,
    SidebarItemComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    SidebarComponent
  ]
})
export class SidebarModule { }