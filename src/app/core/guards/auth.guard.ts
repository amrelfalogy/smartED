import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      // Optionally check user role
      const requiredRole = route.data['role'];
      if (requiredRole) {
        const userRole = this.authService.getUserRole();
        if (userRole !== requiredRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }
      return true;
    } else {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
  }
}