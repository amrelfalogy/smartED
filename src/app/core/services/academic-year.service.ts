import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AcademicYear, StudentYear } from '../models/academic-year.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicYearService {
  private baseUrl = '/api/academic/academic-years'; // for academic years

  constructor(private http: HttpClient) {}

  // GET /academic/academic-years -> { academicYears, pagination }
  getAll(): Observable<AcademicYear[]> {
    return this.http.get<{ academicYears: AcademicYear[]; pagination?: any }>(this.baseUrl)
      .pipe(map(res => res.academicYears));
  }

  getAcademicYears(): Observable<AcademicYear[]> {
    return this.getAll();
  }

  // FIX: API returns { academicYears, pagination }, not a plain array
  // GET /academic/academic-years/active
  getActiveAcademicYears(): Observable<AcademicYear[]> {
    return this.http
      .get<{ academicYears: AcademicYear[]; pagination?: any }>(`${this.baseUrl}/active`)
      .pipe(map(res => res.academicYears));
  }

  // GET /academic/academic-years/current -> { academicYear, studentYears }
  getCurrentAcademicYear(): Observable<{ academicYear: AcademicYear, studentYears: StudentYear[] }> {
    return this.http.get<{ academicYear: AcademicYear, studentYears: StudentYear[] }>(`${this.baseUrl}/current`);
  }

  // GET /academic/academic-years/:id/student-years -> { studentYears } OR []
  getStudentYears(academicYearId: string): Observable<StudentYear[]> {
    return this.http.get<{ studentYears: StudentYear[] } | StudentYear[]>(`${this.baseUrl}/${academicYearId}/student-years`)
      .pipe(map(res => Array.isArray(res) ? res : res.studentYears));
  }
}