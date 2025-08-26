import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-student-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class StudentHeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = false;
  showProfileMenu = false;

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  closeDropdowns() {
    this.showNotifications = false;
    this.showProfileMenu = false;
  }
}