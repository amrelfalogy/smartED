export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'pi pi-home',
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/dashboard',
        icon: 'pi pi-chart-line',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'courses',
    title: 'Course Management',
    type: 'group',
    icon: 'pi pi-book',
    children: [
      {
        id: 'courses-admin',
        title: 'Courses',
        type: 'collapse',
        classes: 'nav-item',
        icon: 'pi pi-play-circle',
        children: [
          {
            id: 'courses-list',
            title: 'Courses List',
            type: 'item',
            classes: 'nav-item',
            url: '/admin/courses',
            icon: 'pi pi-list',
            breadcrumbs: false
          },
          {
            id: 'courses-form',
            title: 'Add Course',
            type: 'item',
            classes: 'nav-item',
            url: '/admin/courses/new',
            icon: 'pi pi-plus-circle',
            breadcrumbs: false
          }
        ]
      }
    ]
  }
];