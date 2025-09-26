// ✅ UPDATED: user.service.ts - Fix image URL construction
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  User, 
  UserProfile, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UsersResponse, 
  UserStatsResponse, 
  UserFilters
} from '../models/user.model';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface UsersStatsOverview {
  totalUsers: number;
  activeUsers: number;
  instructors: number;
  students: number;
  recentRegistrations: number;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'student' | 'teacher' | 'admin';
  isActive?: boolean;
  bio?: string;
  phone?: string;
  profilePicture?: File | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}`;
  private uploadsBaseUrl = environment.uploadsBaseUrl;
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ✅ Unified profile update method with file upload support
  updateUserProfile(userId: string, data: ProfileUpdateData): Observable<any> {
    const formData = new FormData();
    
    // Add text fields to FormData (only if they have values)
    if (data.firstName !== undefined) formData.append('firstName', data.firstName);
    if (data.lastName !== undefined) formData.append('lastName', data.lastName);
    if (data.email !== undefined) formData.append('email', data.email);
    if (data.role !== undefined) formData.append('role', data.role);
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
    if (data.bio !== undefined) formData.append('bio', data.bio);
    if (data.phone !== undefined) formData.append('phone', data.phone);
    
    // Add profile picture file if provided
    if (data.profilePicture instanceof File) {
      formData.append('profilePicture', data.profilePicture);
    }
    
    return this.http.put(`${this.baseUrl}/users/${userId}/profile`, formData);
  }

  // ✅ NEW: Update current user profile (shortcut method)
  // updateCurrentUserProfile(data: ProfileUpdateData): Observable<any> {
  //   const currentUserId = this.getCurrentUserId();
  //   if (!currentUserId) {
  //     throw new Error('No current user found');
  //   }
  //   return this.updateUserProfile(currentUserId, data);
  // }

  // Enhanced getUsers with role filter
  getUserStats(): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.baseUrl}/analytics/users`);
  }

  getUsers(filters: UserFilters = {}): Observable<UsersResponse> {
    let httpParams = new HttpParams();
    
    if (filters.page) httpParams = httpParams.set('page', String(filters.page));
    if (filters.limit) httpParams = httpParams.set('limit', String(filters.limit));
    if (filters.search) httpParams = httpParams.set('search', filters.search);
    if (filters.role) httpParams = httpParams.set('role', filters.role);
    if (filters.isActive !== undefined) httpParams = httpParams.set('isActive', String(filters.isActive));
    if (filters.emailVerified !== undefined) httpParams = httpParams.set('emailVerified', String(filters.emailVerified));
    if (filters.sortBy) httpParams = httpParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder) httpParams = httpParams.set('sortOrder', filters.sortOrder);
    
    return this.http.get<UsersResponse>(`${this.baseUrl}/users`, { params: httpParams });
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, userData);
  }

  getTeachers(params: { search?: string; page?: number; limit?: number } = {}): Observable<UsersResponse> {
    return this.getUsers({ ...params, role: 'teacher' });
  }

  getStudents(params: { search?: string; page?: number; limit?: number } = {}): Observable<UsersResponse> {
    return this.getUsers({ ...params, role: 'student' });
  }

  getSupportUsers(params: { search?: string; page?: number; limit?: number } = {}): Observable<UsersResponse> {
    return this.getUsers({ ...params, role: 'support' });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/profile`);
  }

  updateUserById(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  toggleUserStatus(id: string): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/users/${id}/toggle-status`, {});
  }

  getUsersStatsOverview(): Observable<UsersStatsOverview> {
    return this.http.get<UsersStatsOverview>(`${this.baseUrl}/users/stats/overview`);
  }

  // ✅ UPDATED: Helper to get profile picture URL with proper construction
 getProfileImageUrl(user: User): string {
    if (!user) return '';
    
    const profilePicture = user.profilePicture || user.avatar;
    if (!profilePicture) return '';
    
    // If it's already a full URL, return as is
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }
    
    // If it's just a filename, construct the full URL
    if (profilePicture.includes('/uploads/')) {
      // Already has full path, just prepend base URL
      return `${this.uploadsBaseUrl}${profilePicture}`;
    } else {
      // Just filename, construct full path
      return `${this.uploadsBaseUrl}/uploads/profiles/${profilePicture}`;
    }
  }

  // ✅ NEW: Helper to get user display name
  getUserDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  // ✅ NEW: Helper to get user initials
  getUserInitials(user: User): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // private getCurrentUserId(): string {
  //   return this.authService.getCurrentUserId();
  // }
}