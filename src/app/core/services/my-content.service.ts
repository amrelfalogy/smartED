import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AccessibleLesson,
  SubscribedSubject,
  MyContentResponse,
  MyContentFilters,
  MyContentStats
} from '../models/my-content.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MyContentService {
  private baseUrl = `${environment.apiUrl}/content/my`;

  constructor(private http: HttpClient) {}

  /**
   * Get user's subscribed subjects
   */
  getSubscribedSubjects(filters: MyContentFilters = {}): Observable<SubscribedSubject[]> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<MyContentResponse>(`${this.baseUrl}/subscribed-subjects`, { params })
      .pipe(
        map(response => response.subjects || [])
      );
  }

  /**
   * Get user's accessible lessons
   */
  getAccessibleLessons(filters: MyContentFilters = {}): Observable<AccessibleLesson[]> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.subjectId) params = params.set('subjectId', filters.subjectId);
    if (filters.lessonType) params = params.set('lessonType', filters.lessonType);
    if (filters.difficulty) params = params.set('difficulty', filters.difficulty);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<MyContentResponse>(`${this.baseUrl}/accessible-lessons`, { params })
      .pipe(
        map(response => response.lessons || [])
      );
  }

  /**
   * Get content statistics
   */
  getMyContentStats(): Observable<MyContentStats> {
    return this.http.get<MyContentStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Mark lesson as accessed (for tracking)
   */
  markLessonAccessed(lessonId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/lessons/${lessonId}/access`, {});
  }

  /**
   * Update lesson progress
   */
  updateLessonProgress(lessonId: string, progressData: {
    progressPercentage?: number;
    isCompleted?: boolean;
    watchedDuration?: number;
  }): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/lessons/${lessonId}/progress`, progressData);
  }

  /**
   * Get recommended lessons based on user's subscriptions
   */
  getRecommendedLessons(limit: number = 10): Observable<AccessibleLesson[]> {
    return this.http.get<MyContentResponse>(`${this.baseUrl}/recommended-lessons`, {
      params: { limit: String(limit) }
    }).pipe(
      map(response => response.lessons || [])
    );
  }
}