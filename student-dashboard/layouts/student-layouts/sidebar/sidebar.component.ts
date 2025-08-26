import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  active?: boolean;
}

@Component({
  selector: 'app-student-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class StudentSidebarComponent {
  @Input() collapsed = false;

  navigationItems: NavigationItem[] = [
    {
      label: 'الرئيسية',
      icon: 'fas fa-home',
      route: '/student-dashboard/dashboard',
      active: true
    },
    {
      label: 'جميع الدورات',
      icon: 'fas fa-graduation-cap',
      route: '/student-dashboard/all-courses'
    },
    {
      label: 'دوراتي',
      icon: 'fas fa-book',
      route: '/student-dashboard/my-courses',
      badge: '3'
    },
    {
      label: 'المدفوعات',
      icon: 'fas fa-credit-card',
      route: '/student-dashboard/my-payments'
    },
    {
      label: 'الدعم والمساعدة',
      icon: 'fas fa-question-circle',
      route: '/student-dashboard/support'
    }
  ];

  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
    // Update active state
    this.navigationItems.forEach(item => {
      item.active = item.route === route;
    });
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }
}