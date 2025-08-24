import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() navCollapsed = false;
  @Input() navCollapsedMob = false;
  @Input() isMobile = false;
  
  @Output() NavCollapse = new EventEmitter<void>();
  @Output() NavCollapsedMob = new EventEmitter<void>();

  onDesktopToggle(): void {
    this.NavCollapse.emit();
  }

  onMobileToggle(): void {
    this.NavCollapsedMob.emit();
  }
}