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

  // Create lesson - matches backend structure
  createLesson(lesson: Omit<Lesson, 'id'>): Observable<Lesson> {
    const payload = {
      name: lesson.name,
      title: lesson.title,
      description: lesson.description,
      lectureId: lesson.lectureId, // This should be the unit ID
      duration: lesson.duration,
      lessonType: lesson.lessonType,
      sessionType: lesson.sessionType,
      academicYearId: lesson.academicYearId,
      studentYearId: lesson.studentYearId,
      isFree: lesson.isFree,
      difficulty: lesson.difficulty,
      order: lesson.order
    };
    
    return this.http.post<Lesson>(`${this.baseUrl}`, payload)
      .pipe(catchError(this.handleError));
  }

  // Update lesson
  updateLesson(id: string, lesson: Partial<Lesson>): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.baseUrl}/${id}`, lesson)
      .pipe(catchError(this.handleError));
  }

  // Get lessons by unit (lectureId)
  getLessonsByUnit(unitId: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.baseUrl}?lectureId=${unitId}`)
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