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
    // Check if user has token first (for immediate access)
    const hasToken = !!this.authService.getToken();
    
    if (!hasToken) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    }

    // If has token, check authentication status
    return this.authService.isAuthenticated$.pipe(
      take(1),
      timeout(5000), // 5 second timeout
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Check role-based access if needed
          const requiredRole = route.data['role'];
          if (requiredRole) {
            const userRole = this.authService.getUserRole();
            if (userRole && !this.hasRequiredRole(userRole, requiredRole)) {
              this.router.navigate(['/unauthorized']);
              return false;
            }
            // If role is required but user role is not loaded yet, allow access
            // The user role will be validated once profile loads
          }
          return true;
        } else {
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      }),
      catchError((error) => {
        console.error('Auth guard error:', error);
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

