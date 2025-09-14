import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() SidebarCollapsedMob = new EventEmitter();
  @Input() userRole: string = 'admin';
  @Input() logoPath: string = 'assets/imgs/logo2.png';
  @Input() logoHeight: string = '56px';
  @Input() homeRoute: string = '/home';

  navCollapsedMob: boolean;
  windowWidth: number;

  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.SidebarCollapsedMob.emit();
    }
  }

  get showProCard(): boolean {
    return this.userRole === 'admin' || this.userRole === 'support';
  }
}