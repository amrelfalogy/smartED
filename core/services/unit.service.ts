import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Unit } from '../models/course-complete.model';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private baseUrl = '/api/content/units';

  constructor(private http: HttpClient) {}

  // Get all units
  getAllUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.baseUrl}`)
      .pipe(catchError(this.handleError));
  }

  // Get units by subject
  getUnitsBySubject(subjectId: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.baseUrl}?subjectId=${subjectId}`)
      .pipe(catchError(this.handleError));
  }

  // Create unit - matches backend structure
  createUnit(unit: Omit<Unit, 'id'>): Observable<Unit> {
    const payload = {
      name: unit.name,
      description: unit.description,
      subjectId: unit.subjectId,
      order: unit.order
    };
    
    return this.http.post<Unit>(`${this.baseUrl}`, payload)
      .pipe(catchError(this.handleError));
  }

  // Update unit
  updateUnit(id: string, unit: Partial<Unit>): Observable<Unit> {
    return this.http.put<Unit>(`${this.baseUrl}/${id}`, unit)
      .pipe(catchError(this.handleError));
  }

  // Delete unit
  deleteUnit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Unit Service Error:', error);
    throw error;
  };
}