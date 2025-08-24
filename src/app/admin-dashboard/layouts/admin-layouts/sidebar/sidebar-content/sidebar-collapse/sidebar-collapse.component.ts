import { Component, Input, Output, EventEmitter } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { NavigationItem } from '../../../../../../core/models/navigation.model';

@Component({
  selector: 'app-sidebar-collapse',
  templateUrl: './sidebar-collapse.component.html',
  styleUrls: ['./sidebar-collapse.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', display: 'block' }),
        animate('250ms ease-in', style({ transform: 'translateY(0%)' }))
      ]),
      transition(':leave', [animate('250ms ease-in', style({ transform: 'translateY(-100%)' }))])
    ])
  ]
})
export class SidebarCollapseComponent {
  @Input() item!: NavigationItem;
  @Output() showCollapseItem = new EventEmitter();

  windowWidth: number;

  constructor() {
    this.windowWidth = window.innerWidth;
  }

  navCollapse(e: MouseEvent) {
    let parent = e.target as HTMLElement;

    if (parent?.tagName === 'SPAN') {
      parent = parent.parentElement!;
    }

    parent = (parent as HTMLElement).parentElement as HTMLElement;

    const sections = document.querySelectorAll('.coded-hasmenu');
    for (let i = 0; i < sections.length; i++) {
      if (sections[i] !== parent) {
        sections[i].classList.remove('coded-trigger');
      }
    }

    let first_parent = parent.parentElement;
    let pre_parent = ((parent as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
    if (first_parent?.classList.contains('coded-hasmenu')) {
      do {
        first_parent?.classList.add('coded-trigger');
        first_parent = ((first_parent as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
      } while (first_parent?.classList.contains('coded-hasmenu'));
    } else if (pre_parent?.classList.contains('coded-submenu')) {
      do {
        pre_parent?.parentElement?.classList.add('coded-trigger');
        pre_parent = (((pre_parent as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
      } while (pre_parent?.classList.contains('coded-submenu'));
    }
    parent.classList.toggle('coded-trigger');
  }

  subMenuCollapse(item: void) {
    this.showCollapseItem.emit(item);
  }
   trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}