export interface Course {
  id: number;
  image: string;
  instructor: string;  // Instructor
  instructorImg?: string; // Optional image for instructor
  subject: string; //Type Subject commented till db integration
  academicYear: string;
  rating: number;
  description?: string;
  duration?: string;
  studentsCount?: number;
}

export interface Subject {
  id: string;
  name: string; // "الفيزياء"
  gradeId: string;
  image?: string;
  teacher?: string;
}

export interface Grade {
  id: string;
  name: string; // "الثانية"
  stage: 'اعدادية' | 'ثانوية'; // or use Arabic
  level: number; // 1,2,3
}

export interface Instructor {
  id: number;
  name: string;
  photo: string;
  specialization: string;
  experience: number;
  rating: number;
  bio?: string;
  department?: string;
}



