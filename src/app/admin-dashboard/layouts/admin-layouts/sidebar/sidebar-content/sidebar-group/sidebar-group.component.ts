import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationItem } from '../../../../../../core/models/navigation.model';

@Component({
  selector: 'app-sidebar-group',
  templateUrl: './sidebar-group.component.html',
  styleUrls: ['./sidebar-group.component.scss']
})
export class SidebarGroupComponent implements OnInit {
  @Input() item!: NavigationItem;

  constructor(private location: Location) {}

  ngOnInit() {
    let current_url = this.location.path();
    if ((this.location as any)['_baseHref']) {
      current_url = (this.location as any)['_baseHref'] + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const pre_parent = up_parent?.parentElement;
      const last_parent = up_parent?.parentElement?.parentElement?.parentElement?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (pre_parent?.classList.contains('coded-hasmenu')) {
        pre_parent.classList.add('coded-trigger');
        pre_parent.classList.add('active');
      }

      if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        if (pre_parent?.classList.contains('coded-hasmenu')) {
          pre_parent.classList.add('coded-trigger');
        }
      }
      last_parent?.classList.add('active');
    }
  }

  trackByFn(index: number, item: NavigationItem): string {
    return item.id;
  }
}