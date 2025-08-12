import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AcademicYear, StudentYear } from '../models/academic-year.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicYearService {
    private baseUrl = '/api/academic/academic-years'; // for academic years

  constructor(private http: HttpClient) {}

  getAll(): Observable<AcademicYear[]> {
    return this.getAcademicYears();
  }

  getAcademicYears(): Observable<AcademicYear[]> {
    return this.http.get<AcademicYear[]>(this.baseUrl);
  }

  getStudentYears(academicYearId: string): Observable<StudentYear[]> {
    return this.http.get<StudentYear[]>(`${this.baseUrl}/${academicYearId}/student-years`);
  }
}