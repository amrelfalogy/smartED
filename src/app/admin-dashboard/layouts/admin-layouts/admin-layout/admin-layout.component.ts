import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  navCollapsed = false;
  navCollapsedMob = false;
  windowWidth = window.innerWidth;
  
  // Breakpoints
  readonly MOBILE_BREAKPOINT = 1024;
  
  private routerSubscription!: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkScreenSize();
    
    // Subscribe to router events to close sidebar on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile() && this.navCollapsedMob) {
          this.closeMobileSidebar();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any): void {
    this.windowWidth = event.target.innerWidth;
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.pc-sidebar');
    const headerToggle = target.closest('.pc-h-item');
    
    // Check if click is on a navigation link within sidebar
    if (this.isMobile() && this.navCollapsedMob && sidebar && sidebar.contains(target)) {
      const isNavigationLink = this.isNavigationLink(target);
      const isDropdownToggle = this.isDropdownToggle(target);
      
      // Close sidebar on navigation link click (but not dropdown toggles)
      if (isNavigationLink && !isDropdownToggle) {
        this.closeMobileSidebar();
        return;
      }
    }
    
    // Close mobile sidebar if clicking outside
    if (this.isMobile() && this.navCollapsedMob && sidebar && 
        !sidebar.contains(target) && !headerToggle) {
      this.closeMobileSidebar();
    }
  }

  /**
   * Check if clicked element is a navigation link
   */
  private isNavigationLink(element: HTMLElement): boolean {
    // Check the element itself and its parents
    let current = element;
    while (current && current !== document.body) {
      // Check for navigation link indicators
      if (
        current.tagName === 'A' ||
        current.hasAttribute('routerLink') ||
        current.classList.contains('nav-link') ||
        current.classList.contains('menu-item') ||
        current.classList.contains('sidebar-link') ||
        current.hasAttribute('href')
      ) {
        return true;
      }
      current = current.parentElement as HTMLElement;
    }
    return false;
  }

  /**
   * Check if clicked element is a dropdown toggle (should NOT close sidebar)
   */
  private isDropdownToggle(element: HTMLElement): boolean {
    let current = element;
    while (current && current !== document.body) {
      // Check for dropdown toggle indicators
      if (
        current.classList.contains('dropdown-toggle') ||
        current.classList.contains('submenu-toggle') ||
        current.classList.contains('has-dropdown') ||
        current.hasAttribute('data-toggle') ||
        current.hasAttribute('aria-expanded') ||
        // Check if it has dropdown arrow icon
        current.querySelector('i[class*="chevron"], i[class*="angle"], i[class*="arrow"]')
      ) {
        return true;
      }
      current = current.parentElement as HTMLElement;
    }
    return false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.navCollapsedMob) {
      this.closeMobileSidebar();
    }
  }

  /**
   * Handle desktop sidebar collapse
   */
  onDesktopToggle(): void {
    if (!this.isMobile()) {
      this.navCollapsed = !this.navCollapsed;
      this.updateLayout();
    }
  }

  /**
   * Handle mobile sidebar toggle
   */
  onMobileToggle(): void {
    if (this.isMobile()) {
      this.navCollapsedMob = !this.navCollapsedMob;
      this.updateLayout();
      
      // Prevent body scroll when mobile sidebar is open
      if (this.navCollapsedMob) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  /**
   * Close mobile sidebar
   */
  closeMobileSidebar(): void {
    if (this.navCollapsedMob) {
      this.navCollapsedMob = false;
      this.updateLayout();
      document.body.style.overflow = '';
    }
  }

  /**
   * Check screen size and reset states if needed
   */
  private checkScreenSize(): void {
    if (this.isMobile()) {
      // On mobile, reset desktop collapse
      this.navCollapsed = false;
    } else {
      // On desktop, close mobile sidebar
      this.closeMobileSidebar();
    }
    this.updateLayout();
  }

  /**
   * Update layout classes
   */
  private updateLayout(): void {
    const sidebar = document.querySelector('.pc-sidebar');
    const container = document.querySelector('.pc-container');
    const header = document.querySelector('.pc-header');
    
    if (!sidebar || !container || !header) return;

    // Reset classes
    sidebar.classList.remove('navbar-collapsed', 'mob-open');
    container.classList.remove('sidebar-collapsed', 'mobile-sidebar-open');
    header.classList.remove('sidebar-collapsed');

    if (this.isMobile()) {
      // Mobile layout
      if (this.navCollapsedMob) {
        sidebar.classList.add('mob-open');
        container.classList.add('mobile-sidebar-open');
      }
    } else {
      // Desktop layout
      if (this.navCollapsed) {
        sidebar.classList.add('navbar-collapsed');
        container.classList.add('sidebar-collapsed');
        header.classList.add('sidebar-collapsed');
      }
    }
  }

  /**
   * Check if current screen is mobile
   */
  isMobile(): boolean {
    return this.windowWidth < this.MOBILE_BREAKPOINT;
  }

  /**
   * Get current layout state for components
   */
  getLayoutState() {
    return {
      navCollapsed: this.navCollapsed,
      navCollapsedMob: this.navCollapsedMob,
      isMobile: this.isMobile()
    };
  }
}