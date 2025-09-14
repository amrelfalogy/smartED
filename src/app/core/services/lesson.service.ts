import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Lesson } from '../models/course-complete.model';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface LessonsResponse {
  lessons: any[];
  pagination: { total: number; pages: number; currentPage: number; limit: number };
}

export interface LessonResponse {
  lesson: any;
  videos?: Array<{ url?: string } | string>;
  quizzes?: any[];
  documents?: Array<{ url?: string } | string>;
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  private baseUrl = '/api/content/lessons';

  constructor(private http: HttpClient) {}

  getLessonsByUnit(unitId: string): Observable<Lesson[]> {
    return this.http.get<LessonsResponse>(`${this.baseUrl}?unitId=${unitId}`).pipe(
      map(response => (response.lessons || []).map(l => this.normalize(l))),
      catchError(this.handleError)
    );
  }

  getLesson(id: string): Observable<LessonResponse> {
    return this.http.get<LessonResponse>(`${this.baseUrl}/${id}`).pipe(
      map(res => res),
      catchError(this.handleError)
    );
  }

  createLesson(data: Partial<Lesson> & { title: string; description: string; unitId: string }): Observable<Lesson> {
    const payload = this.transformLessonForAPI(data);
    return this.http.post<LessonResponse>(this.baseUrl, payload).pipe(
      map(response => this.normalize(response.lesson || response)),
      catchError(this.handleError)
    );
  }

  updateLesson(id: string, partial: Partial<Lesson>): Observable<Lesson> {
    const payload = this.transformLessonForAPI(partial);
    return this.http.put<LessonResponse | Lesson>(`${this.baseUrl}/${id}`, payload).pipe(
      map(response => this.normalize(('lesson' in (response as any)) ? (response as any).lesson : response)),
      catchError(this.handleError)
    );
  }

  deleteLesson(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(catchError(this.handleError));
  }

  private transformLessonForAPI(data: any): any {
    // Backend does NOT accept videos/documents here; and name/content are disallowed
    const allowed = [
      'title', 'description', 'unitId', 'order',
      'duration', 'lessonType', 'sessionType', 'difficulty',
      'isFree', 'isActive'
    ];
    const out: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        out[key] = data[key];
      }
    }
    return out;
  }

  private normalize(lesson: any): Lesson {
    if (!lesson) return {} as Lesson;
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      unitId: lesson.unitId || lesson.lectureId,
      order: lesson.order ?? 0,
      isActive: lesson.isActive ?? true,
      isFree: lesson.isFree ?? false,
      duration: lesson.duration ?? 0,
      lessonType: lesson.lessonType || 'center_recorded',
      sessionType: lesson.sessionType || 'recorded',
      difficulty: lesson.difficulty || 'beginner',
      status: lesson.status,
      academicYearId: lesson.academicYearId,
      studentYearId: lesson.studentYearId,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      // Media comes from GET /lessons/:id as separate arrays
      videos: Array.isArray(lesson.videos) ? lesson.videos : undefined,
      documents: Array.isArray(lesson.documents) ? lesson.documents : undefined
    };
  }

  private handleError = (error: any) => {
    console.error('Lesson Service Error', error);
    return throwError(() => error);
  };
}