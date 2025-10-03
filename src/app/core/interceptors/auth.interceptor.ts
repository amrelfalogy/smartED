import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // ✅ Use method-aware skip check
    if (this.shouldSkipAuthForRequest(request)) {
      return next.handle(request);
    }

    // Add token to request
    const token = this.getToken();
    if (token) {
      request = this.addTokenHeader(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Handle 401 Unauthorized errors
        if (error.status === 401 && !this.shouldSkipAuthForRequest(request)) {
          return this.handle401Error(request, next);
        }
        
        // Handle 403 Forbidden errors
        if (error.status === 403) {
          console.warn('Access forbidden:', error);
        }
        
        return throwError(() => error);
      })
    );
  }

  // ✅ UPDATED: Method-aware skip check
  private shouldSkipAuthForRequest(request: HttpRequest<any>): boolean {
    const url = request.url;
    const method = request.method;

    // ✅ Skip auth for specific GET requests only (public read access)
    if (method === 'GET') {
      const publicGetEndpoints = [
        '/content/subjects',
        '/academic/academic-years',
      ];
      
      if (publicGetEndpoints.some(endpoint => url.includes(endpoint))) {
        console.log(`Skipping auth for public GET: ${method} ${url}`);
        return true;
      }
      
      // ✅ Allow GET requests for teachers
      if (url.includes('/users') && url.includes('role=teacher')) {
        console.log(`Skipping auth for teacher list: ${method} ${url}`);
        return true;
      }
    }

    // ✅ Skip auth for all methods on these endpoints
    const alwaysSkipUrls = [
      '/auth/login',
      '/auth/register', 
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/public/',
      '/home'
    ];

    const shouldSkip = alwaysSkipUrls.some(skipUrl => url.includes(skipUrl));
    if (shouldSkip) {
      console.log(`Skipping auth for always-public: ${method} ${url}`);
    }

    return shouldSkip;
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // If we're already trying to refresh, don't try again
    if (this.isRefreshing) {
      this.handleUnauthorized();
      return throwError(() => new Error('Authentication failed'));
    }

    // If this is a refresh token request, logout immediately
    if (request.url.includes('/auth/refresh')) {
      this.handleUnauthorized();
      return throwError(() => new Error('Refresh token expired'));
    }

    // Try to refresh token
    this.isRefreshing = true;
    
    return this.attemptTokenRefresh().pipe(
      switchMap((newToken: string) => {
        this.isRefreshing = false;
        
        // Retry original request with new token
        const newRequest = this.addTokenHeader(request, newToken);
        return next.handle(newRequest);
      }),
      catchError((refreshError) => {
        this.isRefreshing = false;
        this.handleUnauthorized();
        return throwError(() => refreshError);
      })
    );
  }

  private attemptTokenRefresh(): Observable<string> {
    return new Observable(observer => {
      // Make refresh token request
      fetch(`${environment.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Token refresh failed');
        }
        return response.json();
      })
      .then(data => {
        if (data.token) {
          // Update stored token
          localStorage.setItem('authToken', data.token);
          if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          }
          observer.next(data.token);
          observer.complete();
        } else {
          observer.error(new Error('No token in refresh response'));
        }
      })
      .catch(error => {
        console.error('Token refresh failed:', error);
        observer.error(error);
      });
    });
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private handleUnauthorized(): void {
    console.log('Handling unauthorized access - clearing auth data');
    
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Notify other parts of the app about logout
    window.dispatchEvent(new CustomEvent('auth-logout'));
    
    // ✅ Only redirect if on a protected route
    const currentUrl = this.router.url;
    const isPublicRoute = currentUrl === '/' || currentUrl === '/home' || 
                        currentUrl.startsWith('/about') || 
                        currentUrl.startsWith('/auth/');
    
    if (!isPublicRoute && !currentUrl.includes('/auth/')) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: currentUrl }
      });
    }
  }
}