import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'student' | 'admin' | 'support';
  academicYearId?: string;
  studentYearId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  bio?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  bio?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = '/api';
  private tokenKey = 'authToken';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
    this.setupInterceptorListener();
  }

  // ===== AUTHENTICATION =====
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, userData)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.handleLogout()),
        catchError(error => {
          // Even if logout API fails, clear local state
          this.handleLogout();
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {})
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Token refresh failed:', error);
          this.handleLogout();
          return throwError(() => error);
        })
      );
  }

  // ===== PROFILE MANAGEMENT =====
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/profile`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        }),
        catchError(error => {
          console.error('Profile fetch error:', error);
          return throwError(() => error);
        })
      );
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/auth/profile`, profileData)
      .pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(error => {
          console.error('Profile update error:', error);
          return throwError(() => error);
        })
      );
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/change-password`, passwordData)
      .pipe(
        catchError(error => {
          console.error('Password change error:', error);
          return throwError(() => error);
        })
      );
  }

  // ===== TOKEN MANAGEMENT =====
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // ===== UTILITY METHODS =====
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  // ===== PRIVATE METHODS =====
  private handleAuthSuccess(response: AuthResponse): void {
    this.setToken(response.token);
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  private handleLogout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Update auth.service.ts
  private initializeAuth(): void {
    const token = this.getToken();
    console.log('Initializing auth, token exists:', !!token);
    
    if (token) {
      // Don't set authenticated state immediately - wait for profile verification
      this.getProfile().subscribe({
        next: (user) => {
          console.log('Profile loaded successfully:', user);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        },
        error: (error) => {
          console.log('Profile fetch failed, token invalid:', error);
          this.handleLogout();
          // Only redirect if not already on auth pages
          if (!this.router.url.includes('/auth/')) {
            this.router.navigate(['/auth/login']);
          }
        }
      });
    } else {
      console.log('No token found, user not authenticated');
      this.handleLogout();
    }
  }

  // Listen for logout events from interceptor
  private setupInterceptorListener(): void {
    window.addEventListener('auth-logout', () => {
      this.handleLogout();
    });
  }
}