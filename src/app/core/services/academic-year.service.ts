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

   getAll(): Observable<AcademicYear[]> {
    // Map the API response to extract the array
    return this.http.get<{ academicYears: AcademicYear[] }>(this.baseUrl)
      .pipe(map(res => res.academicYears));
  }

  getAcademicYears(): Observable<AcademicYear[]> {
    return this.getAll();
  }

  getActiveAcademicYears(): Observable<AcademicYear[]> {
    return this.http.get<AcademicYear[]>(`${this.baseUrl}/active`);
  }

  getCurrentAcademicYear(): Observable<{ academicYear: AcademicYear, studentYears: StudentYear[] }> {
    return this.http.get<{ academicYear: AcademicYear, studentYears: StudentYear[] }>(`${this.baseUrl}/current`);
  }

  getStudentYears(academicYearId: string): Observable<StudentYear[]> {
  return this.http.get<{ studentYears: StudentYear[] } | StudentYear[]>(`${this.baseUrl}/${academicYearId}/student-years`)
    .pipe(
      map(res => Array.isArray(res) ? res : res.studentYears)
    );
}
}