import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Subject } from '../models/course-complete.model';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private baseUrl = '/api/content/subjects';
  private subjectsSubject = new BehaviorSubject<Subject[]>([]);
  public subjects$ = this.subjectsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all subjects
  getAllSubjects(params?: any): Observable<Subject[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    // ✅ Map the backend response structure
    return this.http.get<{ subjects: Subject[], pagination: any }>(`${this.baseUrl}`, { params: httpParams })
      .pipe(
        map(response => response.subjects), // Extract subjects array
        catchError(this.handleError)
      );
  }

  // ✅ Add status management methods
  publishSubject(id: string): Observable<Subject> {
    return this.http.patch<Subject>(`${this.baseUrl}/${id}/publish`, {})
      .pipe(catchError(this.handleError));
  }

  updateSubjectStatus(id: string, status: 'draft' | 'published'): Observable<Subject> {
  return this.http.patch<Subject>(`${this.baseUrl}/${id}/status`, { status })
    .pipe(catchError(this.handleError));
}

  // Get single subject
  getSubject(id: string): Observable<Subject> {
    return this.http.get<Subject>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Create subject - matches backend structure
  createSubject(subject: Omit<Subject, 'id'>): Observable<Subject> {
    return this.http.post<{ message: string; subject: Subject }>(`${this.baseUrl}`, subject)
      .pipe(
        map(res => res.subject),
        catchError(this.handleError)
      );
  }

  // Update subject
  updateSubject(id: string, subject: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.baseUrl}/${id}`, subject)
      .pipe(catchError(this.handleError));
  }

  // Delete subject
   deleteSubject(id: string): Observable<void> {
      return this.http.delete<void>(`${this.baseUrl}/${id}`)
        .pipe(catchError(this.handleError));
    }

  private handleError = (error: any): Observable<never> => {
    console.error('Subject Service Error:', error);
    throw error;
  };
}