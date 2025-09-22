// ✅ UPDATED: user.service.ts - Add profile endpoints
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
  UserFilters,
  ProfileResponse,
  ProfilePictureUploadResponse
} from '../models/user.model';
import { environment } from 'src/environments/environment';

export interface UsersStatsOverview {
  totalUsers: number;
  activeUsers: number;
  instructors: number;
  students: number;
  recentRegistrations: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // ✅ NEW: Get current user profile using new endpoint
  getCurrentUserProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/profile/profile`);
  }

  // ✅ NEW: Get user profile by ID using new endpoint
  getUserProfileById(userId: string): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/profile/profile/${userId}`);
  }

  // ✅ NEW: Update current user profile using new endpoint
  updateCurrentUserProfile(data: Partial<User>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.baseUrl}/profile/profile`, data);
  }

  // ✅ NEW: Upload profile picture
  uploadProfilePicture(file: File): Observable<ProfilePictureUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ProfilePictureUploadResponse>(
      `${this.baseUrl}/profile/profile/picture`, 
      formData
    );
  }

  // ✅ NEW: Delete profile picture
  deleteProfilePicture(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/profile/profile/picture`
    );
  }

  // ✅ Enhanced getUsers with role filter
  getUserStats(): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.baseUrl}/analytics/users`);
  }

  // ✅ UPDATE: Enhanced getUsers with full filter support  
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

  // ✅ ADD: Create new user (admin only)
  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, userData);
  }

  // ✅ Get teachers with search/pagination
  getTeachers(params: { search?: string; page?: number; limit?: number } = {}): Observable<UsersResponse> {
    return this.getUsers({ ...params, role: 'teacher' });
  }

  // ✅ ADD: Get students with search/pagination
  getStudents(params: { search?: string; page?: number; limit?: number } = {}): Observable<UsersResponse> {
    return this.getUsers({ ...params, role: 'student' });
  }

  // ✅ ADD: Get support users with search/pagination
  getSupportUsers(params: { search?: string; page?: number; limit?: number } = {}): Observable<UsersResponse> {
    return this.getUsers({ ...params, role: 'support' });
  }

  // ✅ ADD: Get user by ID
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  // ✅ DEPRECATED: Use getCurrentUserProfile() instead
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/profile`);
  }

  // ✅ DEPRECATED: Use updateCurrentUserProfile() instead
  updateUserProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/users/profile`, data);
  }

  // ✅ ADD: Update user by ID (admin only)
  updateUserById(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, data);
  }

  // ✅ ADD: Delete user by ID (admin only)
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  // ✅ ADD: Toggle user active status
  toggleUserStatus(id: string): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/users/${id}/toggle-status`, {});
  }

  getUsersStatsOverview(): Observable<UsersStatsOverview> {
    return this.http.get<UsersStatsOverview>(`${this.baseUrl}/users/stats/overview`);
  }

  // ✅ NEW: Helper to get profile picture URL
  getProfileImageUrl(user: User): string {
    // Prioritize profilePicture over avatar
    return user.profilePicture || user.avatar || '';
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
}