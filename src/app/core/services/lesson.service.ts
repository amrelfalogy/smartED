import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Lesson } from '../models/course-complete.model';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private baseUrl = '/api/content/lessons';

  constructor(private http: HttpClient) {}

  // ✅ ADD: Get lessons by unit
  getLessonsByUnit(unitId: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.baseUrl}?unitId=${unitId}`)
      .pipe(catchError(this.handleError));
  }

  // Get single lesson
  getLesson(id: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Create lesson
  createLesson(lesson: Omit<Lesson, 'id'>): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.baseUrl}`, lesson)
      .pipe(catchError(this.handleError));
  }

  // Update lesson
  updateLesson(id: string, lesson: Partial<Lesson>): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.baseUrl}/${id}`, lesson)
      .pipe(catchError(this.handleError));
  }

  // Delete lesson
  deleteLesson(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Lesson Service Error:', error);
    throw error;
  };
}