import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
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
    this.checkAuthStatus();
  }

  // ===== AUTHENTICATION =====
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, userData)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.handleLogout())
      );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {})
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  // ===== PROFILE MANAGEMENT =====
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/profile`)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/auth/profile`, profileData)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }

   changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/change-password`, passwordData);
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

   private handleAuthSuccess(response: AuthResponse): void {
    this.setToken(response.token);
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  private handleLogout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticatedSubject.next(true);
      // Optionally fetch user profile
      this.getProfile().subscribe({
        error: () => this.handleLogout()
      });
    }
  }
}