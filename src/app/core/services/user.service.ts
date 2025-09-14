import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'admin' | 'teacher' | 'support';
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  lastLogin?: string | null;
  emailVerified: boolean;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    current: number;
    total: number;
    totalItems: number;
  };
}

export interface UsersStatsOverview {
  totalUsers: number;
  activeUsers: number;
  instructors: number;
  students: number;
  recentRegistrations: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getUsers(params: { page?: number; limit?: number } = {}): Observable<UsersResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<UsersResponse>(`${this.baseUrl}/users`, { params: httpParams });
  }

  getUsersStatsOverview(): Observable<UsersStatsOverview> {
    return this.http.get<UsersStatsOverview>(`${this.baseUrl}/users/stats/overview`);
  }
}