export interface Subject {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  order: number;
  units?: Unit[];
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  isActive: boolean;
  order: number;
  subject?: Subject;
  lectures?: Lecture[];
}

export interface Lecture {
  id: string;
  name: string;
  description?: string;
  unitId: string;
  teacherId: string;
  isActive: boolean;
  order: number;
  unit?: Unit;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  lectureId: string;
  duration?: number;
  isActive: boolean;
  isFree: boolean;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessonType: 'center_recorded' | 'studio_produced';
  sessionType: 'recorded' | 'live';
  academicYearId: string;
  studentYearId: string;
  perSessionPrice?: number;
  semesterPrice?: number;
  currency: string;
  zoomLink?: string;
  sessionDateTime?: string; // ISO string
  lecture?: Lecture;
}