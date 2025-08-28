import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take, timeout } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

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

  private hasRequiredRole(userRole: string, requiredRole: string): boolean {
    if (requiredRole === 'admin') {
      return userRole === 'admin' || userRole === 'support';
    }
    else if(requiredRole === 'student') {
      return userRole === 'student';
    }
    return userRole === requiredRole;
  }
}