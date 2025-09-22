import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Subject } from '../models/course-complete.model';
import { environment } from 'src/environments/environment';

export interface SubjectListParams {
  status?: 'draft' | 'published';
  academicYearId?: string;
  studentYearId?: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  // NEW: filter by subject sessionType from backend
  sessionType?: 'recorded' | 'live' | 'zoom' | 'teams' | 'webinar' | 'center_recorded' | 'studio' | 'all';
}

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private baseUrl = `${environment.apiUrl}/content/subjects`;
  private subjectsSubject = new BehaviorSubject<Subject[]>([]);
  subjects$ = this.subjectsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllSubjects(params?: SubjectListParams): Observable<Subject[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'all') {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http
      .get<{ subjects: Subject[]; pagination?: any }>(this.baseUrl, { params: httpParams })
      .pipe(map(r => r.subjects || []), catchError(this.handleError));
  }

  getSubject(id: string): Observable<Subject> {
    return this.http
      .get<{ subject?: Subject } | Subject>(`${this.baseUrl}/${encodeURIComponent(id)}`)
      .pipe(
        map(res => (res as any).subject ? (res as any).subject as Subject : (res as Subject)),
        catchError(this.handleError)
      );
  }

  createSubject(subject: Omit<Subject, 'id'>): Observable<Subject> {
    const payload = this.serializeSubject(subject);
    return this.http
      .post<{ message: string; subject: Subject }>(this.baseUrl, payload)
      .pipe(map(res => this.ensureStatus(res.subject)), catchError(this.handleError));
  }

  updateSubject(id: string, subject: Partial<Subject>): Observable<Subject> {
    const payload = this.serializeSubject(subject as Subject);
    return this.http
      .put<{ message?: string; subject?: Subject } | Subject>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload)
      .pipe(
        map(res => {
          const s = (res as any).subject ? (res as any).subject : (res as Subject);
          return this.ensureStatus(s);
        }),
        catchError(this.handleError)
      );
  }

  updateSubjectStatus(id: string, status: 'draft' | 'published'): Observable<Subject> {
    return this.http
      .patch<{ message?: string; subject?: Subject } | Subject>(`${this.baseUrl}/${encodeURIComponent(id)}/status`, { status })
      .pipe(
        map(res => {
          const s = (res as any).subject ? (res as any).subject : (res as Subject);
          return this.ensureStatus(s);
        }),
        catchError(this.handleError)
      );
  }

  deleteSubject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`).pipe(catchError(this.handleError));
  }

  // ---- Helpers ----
  private serializeSubject(s: Subject) {
    const raw: Record<string, any> = {
      name: s.name?.trim(),
      description: s.description?.trim(),
      difficulty: s.difficulty,
      duration: s.duration?.trim(),
      imageUrl: s.imageUrl?.trim(),
      order: s.order,
      academicYearId: s.academicYearId ?? null,
      studentYearId: s.studentYearId ?? null,
      teacherId: s.teacherId ?? null,
      // NEW: sessionType and price on subject
      sessionType: (s as any).sessionType ?? null,
      price: (s as any).price ?? null
    };
    Object.keys(raw).forEach(k => {
      const v = raw[k];
      if (v === undefined) delete raw[k];
      if (v === '') raw[k] = null;
    });
    return raw;
  }

  private ensureStatus(subject: Subject): Subject {
    if (!subject.status) subject.status = 'draft';
    return subject;
  }

  private handleError = (error: any) => {
    const backend = error?.error;
    let details = '';
    if (backend?.details && Array.isArray(backend.details)) {
      details = backend.details.map((d: any) => `${d.field}: ${d.message}`).join(' | ');
    }
    const msg =
      details ||
      backend?.message ||
      backend?.error ||
      error?.statusText ||
      'Unknown error';
    console.error('Subject Service Error', {
      status: error?.status,
      url: error?.url,
      backend,
      friendly: msg
    });
    return throwError(() => ({ ...error, friendlyMessage: msg }));
  };
}