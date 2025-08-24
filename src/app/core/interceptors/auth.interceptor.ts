import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth header for login/register requests
    if (this.shouldSkipAuth(request.url)) {
      return next.handle(request);
    }

    // Add auth header if token exists
    const token = this.getToken();
    if (token) {
      request = this.addTokenHeader(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401 && !this.shouldSkipAuth(request.url)) {
          this.handleUnauthorized();
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private shouldSkipAuth(url: string): boolean {
    const skipUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
    return skipUrls.some(skipUrl => url.includes(skipUrl));
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private handleUnauthorized(): void {
    // Clear token
    localStorage.removeItem('authToken');
    
    // Notify other parts of the app about logout
    window.dispatchEvent(new CustomEvent('auth-logout'));
    
    // Redirect to login
    this.router.navigate(['/auth/login']);
  }
}