import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take, timeout } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Subject, Unit } from '../models/course-complete.model';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
): Observable<boolean> {
  const requiresAuth = route.data['requiresAuth'];
  
  // ✅ Allow access to public routes immediately
  if (requiresAuth === false) {
    console.log('Public route, allowing access:', state.url);
    return of(true);
  }

  // ✅ For protected routes, check authentication
  const hasToken = !!this.authService.getToken();
  
  if (!hasToken) {
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return of(false);
  }

  // ✅ Validate token for protected routes
  return this.authService.validateCurrentToken().pipe(
    map(user => {
      // Check role-based access if needed
      const requiredRole = route.data['role'];
      if (requiredRole) {
        const userRole = user.role;
        if (!this.hasRequiredRole(userRole, requiredRole)) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }
      return true;
    }),
    catchError((error) => {
      console.error('Auth guard token validation error:', error);
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
}
  // ✅ FIXED: auth.guard.ts - Better role checking
  private hasRequiredRole(userRole: string, requiredRole: string | string[]): boolean {
    console.log('🛡️ Role check:', { userRole, requiredRole });
    
    // If requiredRole is an array, check if userRole is in the array
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    // If requiredRole is a string, handle specific cases
    switch (requiredRole) {
      case 'admin':
        return userRole === 'admin'; // ✅ Only admin can access admin-only routes
      case 'support':
        return userRole === 'support' || userRole === 'admin'; // ✅ Both support and admin can access support routes
      case 'student':
        return userRole === 'student';
      case 'admin_or_support': // ✅ New role for shared access
        return userRole === 'admin' || userRole === 'support';
      default:
        return userRole === requiredRole;
    }
  }
}

