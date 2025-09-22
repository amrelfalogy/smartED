import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AdminDashboardOverview {
  period: number;
  users: { total: number; new: number };
  content: { subjects: number; lessons: number };
  payments: { total: { count: number; amount: number }; recent: { count: number; amount: number } };
  enrollments: { active: number };
}

export interface UsersAnalytics {
  usersByRole: Array<{ role: string; count: number }>;
  registrationTrend: Array<{ date: string; count: number }>;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getAdminDashboardOverview(): Observable<AdminDashboardOverview> {
    return this.http.get<AdminDashboardOverview>(`${this.baseUrl}/analytics/dashboard`);
  }

  getUsersAnalytics(): Observable<UsersAnalytics> {
    return this.http.get<UsersAnalytics>(`${this.baseUrl}/analytics/users`);
  }
}