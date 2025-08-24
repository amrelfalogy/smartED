import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header-left',
  templateUrl: './header-left.component.html',
  styleUrls: ['./header-left.component.scss']
})
export class HeaderLeftComponent {
  @Input() navCollapsed = false;
  @Input() navCollapsedMob = false;
  @Input() isMobile = false;
  
  @Output() NavCollapse = new EventEmitter<void>();
  @Output() NavCollapsedMob = new EventEmitter<void>();

  onDesktopToggle(): void {
    if (!this.isMobile) {
      this.NavCollapse.emit();
    }
  }

  onMobileToggle(): void {
    if (this.isMobile) {
      this.NavCollapsedMob.emit();
    }
  }

  getDesktopIcon(): string {
    return this.navCollapsed ? 'pi-angle-double-right' : 'pi-bars';
  }

  getMobileIcon(): string {
    return this.navCollapsedMob ? 'pi-times' : 'pi-bars';
  }
}