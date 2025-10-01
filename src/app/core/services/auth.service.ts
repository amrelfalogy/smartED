// auth.service.ts - Updated Version with Nested User Data Fix
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
  profilePicture?: string; // ✅ NEW
  avatar?: string; // ✅ NEW
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
  private baseUrl = `${environment.apiUrl}`;
  private tokenKey = 'authToken';
  private userKey = 'currentUser';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
    this.setupInterceptorListener();
  }

  // ===== AUTHENTICATION =====
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, userData)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  logout(): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http.post(`${this.baseUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.handleLogout()),
        catchError(error => {
          // Even if logout API fails, clear local state
          this.handleLogout();
          return throwError(() => error);
        }),
        finalize(() => this.isLoadingSubject.next(false))
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
    return this.http.get<any>(`${this.baseUrl}/auth/profile`)
      .pipe(
        tap(response => {
          console.log('Profile response:', response);
          // ✅ FIX: Normalize user data structure
          const normalizedUser = this.normalizeUserData(response);
          this.setCurrentUser(normalizedUser);
        }),
        map(response => this.normalizeUserData(response)),
        catchError(error => {
          console.error('Profile fetch error:', error);
          this.handleLogout();
          return throwError(() => error);
        })
      );
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<User> {
    return this.http.put<any>(`${this.baseUrl}/auth/profile`, profileData)
      .pipe(
        tap(response => {
          console.log('Profile update response:', response);
          // ✅ FIX: Normalize user data structure
          const normalizedUser = this.normalizeUserData(response);
          this.setCurrentUser(normalizedUser);
        }),
        map(response => this.normalizeUserData(response)),
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

  // ===== USER DATA MANAGEMENT =====
  // ✅ NEW: Normalize user data structure
  private normalizeUserData(userData: any): User {
    const user = userData?.user || userData;
    
    if (!user) {
      throw new Error('Invalid user data structure');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      bio: user.bio || '',
      address: user.address || '',
      profilePicture: user.profilePicture || null, // ✅ NEW
      avatar: user.avatar || null // ✅ NEW
    };
  }

  // ✅ NEW: Get user profile image URL
  getUserProfileImage(): string {
    const user = this.getCurrentUser();
    return user?.profilePicture || user?.avatar || '';
  }

  // ✅ UPDATED: Set current user with normalization
  private setCurrentUser(userData: any): void {
    const normalizedUser = this.normalizeUserData(userData);
    
    console.log('Setting normalized current user:', normalizedUser);
    this.currentUserSubject.next(normalizedUser);
    this.isAuthenticatedSubject.next(true);
    
    // Store normalized user data
    this.setUser(normalizedUser);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // ✅ UPDATED: Get stored user with normalization
  private getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.userKey);
      if (userStr) {
        const userData = JSON.parse(userStr);
        // ✅ FIX: Normalize stored user data
        return this.normalizeUserData(userData);
      }
      return null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private removeUser(): void {
    localStorage.removeItem(this.userKey);
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

  // Check if authentication is in progress
  isAuthInitialized(): boolean {
    return !this.isLoadingSubject.value;
  }

  // ===== PRIVATE METHODS =====
  // ✅ UPDATED: Handle auth success with normalization
  private handleAuthSuccess(response: AuthResponse): void {
    console.log('Auth success response:', response);
    
    this.setToken(response.token);
    
    // ✅ FIX: Normalize user data before setting
    const normalizedUser = this.normalizeUserData(response.user || response);
    this.setUser(normalizedUser);
    this.currentUserSubject.next(normalizedUser);
    this.isAuthenticatedSubject.next(true);
    
    console.log('Auth success - normalized user set:', normalizedUser);
  }

  private handleLogout(): void {
    console.log('Handling logout - clearing auth state');
    this.removeToken();
    this.removeUser();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // ✅ UPDATED: Initialize auth with proper error handling
  private initializeAuth(): void {
    this.isLoadingSubject.next(true);
    
    const token = this.getToken();
    const storedUser = this.getStoredUser();
    
    console.log('Initializing auth - Token exists:', !!token, 'Stored user:', !!storedUser);
    
    if (token && storedUser) {
      // ✅ Set stored user data immediately
      console.log('Setting stored user and auth state immediately:', storedUser);
      this.currentUserSubject.next(storedUser);
      this.isAuthenticatedSubject.next(true);
    } else {
      // ✅ No token or user - set unauthenticated state
      console.log('No valid token/user found, user not authenticated');
      this.handleLogout();
    }
    
    this.isLoadingSubject.next(false);
  }

  // ✅ NEW: Separate method to validate token when needed
  validateCurrentToken(): Observable<User> {
    return this.getProfile().pipe(
      catchError(error => {
        console.log('Token validation failed, clearing auth:', error);
        this.handleLogout();
        return throwError(() => error);
      })
    );
  }

  // Listen for logout events from interceptor
  private setupInterceptorListener(): void {
    window.addEventListener('auth-logout', () => {
      console.log('Received logout event from interceptor');
      this.handleLogout();
    });
  }

  // ===== ADDITIONAL UTILITY METHODS =====
  
  // ✅ NEW: Check if user has specific role
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // ✅ NEW: Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  // ✅ NEW: Get user display name
  getUserDisplayName(): string {
    const user = this.getCurrentUser();
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'مستخدم';
  }

  // ✅ NEW: Get user initials
  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (user && user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'م';
  }

  // ✅ NEW: Check if current user can access admin features
  canAccessAdmin(): boolean {
    return this.hasAnyRole(['admin', 'support']);
  }

  // ✅ NEW: Check if current user is a student
  isStudent(): boolean {
    return this.hasRole('student');
  }

  // ✅ NEW: Check if current user is an admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // ✅ NEW: Get role-specific dashboard URL
  getDashboardUrl(): string {
    const role = this.getUserRole();
    switch (role) {
      case 'admin':
      case 'support':
        return '/admin/dashboard';
      case 'student':
        return '/student-dashboard';
      default:
        return '/';
    }
  }
}