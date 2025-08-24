import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Location, LocationStrategy } from '@angular/common';
import { NavigationItem, NavigationItems } from '../../../../../core/models/navigation.model';

@Component({
  selector: 'app-sidebar-content',
  templateUrl: './sidebar-content.component.html',
  styleUrls: ['./sidebar-content.component.scss']
})
export class SidebarContentComponent implements OnInit {
  @Output() SidebarCollapsedMob = new EventEmitter();

  navigations: NavigationItem[];
  navigation = NavigationItems;
  windowWidth = window.innerWidth;

  constructor(
    private location: Location,
    private locationStrategy: LocationStrategy
  ) {
    this.navigations = NavigationItems;
  }

  ngOnInit() {
    if (this.windowWidth < 1025) {
      (document.querySelector('.coded-navbar') as HTMLDivElement)?.classList.add('menupos-static');
    }
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  navMob() {
    if (this.windowWidth < 1025 && document.querySelector('app-sidebar.coded-navbar')?.classList.contains('mob-open')) {
      this.SidebarCollapsedMob.emit();
    }
  }

  trackByFn(index: number, item: NavigationItem): string {
    return item.id;
  }
}