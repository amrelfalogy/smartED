import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Unit } from '../models/course-complete.model';
import { environment } from 'src/environments/environment';

interface UnitsResponse {
  units: any[];
  pagination?: { total: number; pages: number; currentPage: number; limit: number };
}

interface UnitCreateResponse {
  unit?: any; // backend often wraps created resource here
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class UnitService {
  private baseUrl = `${environment.apiUrl}/content/units`;

  constructor(private http: HttpClient) {}

  getUnitsBySubject(subjectId: string): Observable<Unit[]> {
    const params = new HttpParams().set('subjectId', subjectId);
    return this.http.get<UnitsResponse | Unit[]>(this.baseUrl, { params }).pipe(
      map((res: UnitsResponse | Unit[]) => {
        const rawUnits = Array.isArray(res) ? res : (res.units || []);
        return rawUnits.map(u => this.normalize(u));
      }),
      catchError(this.handleError)
    );
  }

  createUnit(payload: Partial<Unit> & { name: string; description: string; subjectId: string; order?: number }): Observable<Unit> {
    const body = {
      name: payload.name,
      description: payload.description,
      subjectId: payload.subjectId,
      order: payload.order ?? 1
    };

    return this.http.post<UnitCreateResponse>(this.baseUrl, body).pipe(
      map(res => {
        const raw = (res && res.unit) ? res.unit : res;
        return this.normalize(raw);
      }),
      catchError(this.handleError)
    );
  }

  updateUnit(id: string, payload: Partial<Unit>): Observable<Unit> {
    return this.http.put<any>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload).pipe(
      map(res => this.normalize((res && res.unit) ? res.unit : res)),
      catchError(this.handleError)
    );
  }

  deleteUnit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`).pipe(catchError(this.handleError));
  }

  private normalize(raw: any): Unit {
    if (!raw) return {} as Unit;
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      subjectId: raw.subjectId,
      thumbnail: raw.thumbnail ?? null,
      status: raw.status || 'published', // backend returns published on create
      isActive: raw.isActive ?? true,
      order: raw.order ?? 1,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      lessons: raw.lessons || []
    };
  }

  private handleError = (error: any) => {
    console.error('UnitService error:', error);
    return throwError(() => error);
  };
}