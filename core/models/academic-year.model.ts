export interface AcademicYear {
  id: string;
  name: string;
  displayName: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  isActive: boolean;
  isCurrent: boolean;
  order: number;
  studentYears?: StudentYear[];
}

export interface StudentYear {
  id: string;
  name: string;
  displayName: string;
  academicYearId: string;
  gradeLevel: number;
  isActive: boolean;
  order: number;
  academicYear?: AcademicYear;
}