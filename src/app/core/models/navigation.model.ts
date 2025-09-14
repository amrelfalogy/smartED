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
  role?: string[]; // Add role-based access
}

// Admin Navigation Items
export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'pi pi-home',
    role: ['admin', 'support'],
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/dashboard',
        icon: 'pi pi-chart-line',
        breadcrumbs: false,
        role: ['admin', 'support']
      }
    ]
  },
  {
    id: 'courses',
    title: 'Course Management',
    type: 'group',
    icon: 'pi pi-book',
    role: ['admin', 'support'],
    children: [
      {
        id: 'courses-admin',
        title: 'Courses',
        type: 'collapse',
        classes: 'nav-item',
        icon: 'pi pi-play-circle',
        role: ['admin', 'support'],
        children: [
          {
            id: 'courses-list',
            title: 'Courses List',
            type: 'item',
            classes: 'nav-item',
            url: '/admin/courses',
            icon: 'pi pi-list',
            breadcrumbs: false,
            role: ['admin', 'support']
          },
          {
            id: 'courses-form',
            title: 'Add Course',
            type: 'item',
            classes: 'nav-item',
            url: '/admin/courses/new',
            icon: 'pi pi-plus-circle',
            breadcrumbs: false,
            role: ['admin']
          }
        ]
      },
      {
        id: 'payments-admin',
        title: 'Payments',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/payments',
        icon: 'pi pi-credit-card',
        breadcrumbs: false,
        role: ['admin', 'support']
      },
    ]
  },
  {
    id: 'users',
    title: 'User Management',
    type: 'group',
    icon: 'pi pi-users',
    role: ['admin'],
    children: [
      {
        id: 'students',
        title: 'Students',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/students',
        icon: 'pi pi-user',
        breadcrumbs: false,
        role: ['admin']
      },
      {
        id: 'instructors',
        title: 'Instructors',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/instructors',
        icon: 'pi pi-user-plus',
        breadcrumbs: false,
        role: ['admin']
      }
    ]
  }
];

// Student Navigation Items
export const StudentNavigationItems: NavigationItem[] = [
  {
    id: 'student-dashboard',
    title: 'لوحة التحكم',
    type: 'group',
    icon: 'pi pi-tachometer-alt',
    role: ['student'],
    children: [
      {
        id: 'student-dashboard-home',
        title: 'الرئيسية',
        type: 'item',
        classes: 'nav-item',
        url: '/student-dashboard',
        icon: 'pi pi-home',
        breadcrumbs: false,
        role: ['student']
      }
    ]
  },
  {
    id: 'my-learning',
    title: 'التعلم',
    type: 'group',
    icon: 'pi pi-graduation-cap',
    role: ['student'],
    children: [
      {
        id: 'my-courses',
        title: 'دوراتي',
        type: 'item',
        classes: 'nav-item',
        url: '/student-dashboard/my-courses',
        icon: 'pi pi-book',
        breadcrumbs: false,
        role: ['student']
      },
      {
        id: 'all-courses',
        title: 'جميع الدورات',
        type: 'item',
        classes: 'nav-item',
        url: '/student-dashboard/courses',
        icon: 'pi pi-list',
        breadcrumbs: false,
        role: ['student']
      },
      {
        id: 'course-progress',
        title: 'تقدم الدورات',
        type: 'item',
        classes: 'nav-item',
        url: '/student-dashboard/progress',
        icon: 'pi pi-chart-line',
        breadcrumbs: false,
        role: ['student']
      }
    ]
  },
  {
    id: 'payments',
    title: 'الدفع والفواتير',
    type: 'group',
    icon: 'pi pi-credit-card',
    role: ['student'],
    children: [
      // {
      //   id: 'my-payments',
      //   title: 'مدفوعاتي',
      //   type: 'item',
      //   classes: 'nav-item',
      //   url: '/student-dashboard/my-payments',
      //   icon: 'pi pi-receipt',
      //   breadcrumbs: false,
      //   role: ['student']
      // },
      {
        id: 'payment-history',
        title: 'سجل المدفوعات',
        type: 'item',
        classes: 'nav-item',
        url: '/student-dashboard/my-payments',
        icon: 'pi pi-history',
        breadcrumbs: false,
        role: ['student']
      }
    ]
  },
  {
    id: 'profile',
    title: 'الملف الشخصي',
    type: 'group',
    icon: 'pi pi-user',
    role: ['student'],
    children: [
      {
        id: 'my-profile',
        title: 'بياناتي',
        type: 'item',
        classes: 'nav-item',
        url: '/student-dashboard/profile',
        icon: 'pi pi-user-edit',
        breadcrumbs: false,
        role: ['student']
      }
    ]
  }
];

// Function to get navigation based on role
export function getNavigationByRole(role: string): NavigationItem[] {
  switch (role) {
    case 'admin':
    case 'support':
      return NavigationItems;
    case 'student':
      return StudentNavigationItems;
    default:
      return [];
  }
}

// Function to filter navigation items by user role
export function filterNavigationByRole(items: NavigationItem[], userRole: string): NavigationItem[] {
  return items
    .filter(item => !item.role || item.role.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children 
        ? filterNavigationByRole(item.children, userRole) 
        : undefined
    }))
    .filter(item => !item.children || item.children.length > 0);
}