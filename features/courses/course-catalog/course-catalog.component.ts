import { Component } from '@angular/core';
import { Course, Grade } from 'src/app/core/models/entities.model';

@Component({
  selector: 'app-course-catalog',
  templateUrl: './course-catalog.component.html',
  styleUrls: ['./course-catalog.component.css']
})
export class CourseCatalogComponent {
  grades: Grade[] = [
    { id: '1', name: 'الأولى', stage: 'ثانوية', level: 1 },
    { id: '2', name: 'الثانية', stage: 'ثانوية', level: 2 },
    { id: '3', name: 'الثالثة', stage: 'ثانوية', level: 3 },
    { id: '4', name: 'الأولى', stage: 'اعدادية', level: 1 },
    { id: '5', name: 'الثانية', stage: 'اعدادية', level: 2 },
    { id: '6', name: 'الثالثة', stage: 'اعدادية', level: 3 }
  ];

  courses: Course[] = [
    { id: 1, image: 'assets/imgs/Model2.png', instructor: 'أ. محمد علي', subject: 'مقدمة في البرمجة', academicYear: '2 ثانوي', rating: 4, description: 'تعلم أساسيات البرمجة من الصفر', duration: '30 ساعة', studentsCount: 120 },
    { id: 2, image: 'assets/imgs/Model2.png', instructor: 'أ. محمد علي', subject: 'التصميم الجرافيكي', academicYear: '3 ثانوي', rating: 3, description: 'أساسيات التصميم الجرافيكي', duration: '20 ساعة', studentsCount: 85 },
    { id: 3, image: 'assets/imgs/Model2.png', instructor: 'أ. محمد علي', subject: 'التسويق الرقمي', academicYear: '2 ثانوي', rating: 5, description: 'مقدمة في التسويق الرقمي', duration: '25 ساعة', studentsCount: 110 },
    { id: 4, image: 'assets/imgs/Model2.png', instructor: 'أ. محمد علي', subject: 'فيزياء متقدمة', academicYear: '3 ثانوي', rating: 2, description: 'مفاهيم الفيزياء الحديثة والمتقدمة', duration: '40 ساعة', studentsCount: 60 },
    { id: 5, image: 'assets/imgs/Model2.png', instructor: 'أ. محمد علي', subject: 'علم الأحياء', academicYear: '2 ثانوي', rating: 3, description: 'أساسيات علم الأحياء', duration: '22 ساعة', studentsCount: 77 },
    { id: 6, image: 'assets/imgs/Model2.png', instructor: 'أ. فاطمة محمود', subject: 'لغة عربية', academicYear: '1 اعدادي', rating: 5, description: 'شرح شامل للغة العربية', duration: '18 ساعة', studentsCount: 180 },
    { id: 7, image: 'assets/imgs/Model2.png', instructor: 'أ. أحمد سمير', subject: 'رياضيات', academicYear: '1 ثانوي', rating: 4, description: 'أساسيات الرياضيات للثانوي', duration: '35 ساعة', studentsCount: 95 }
  ];

  selectedStage: 'اعدادية' | 'ثانوية' | null = null;
  selectedAcademicYear: string | null = null;

  getGradesForStage(): Grade[] {
    return this.selectedStage
      ? this.grades.filter(g => g.stage === this.selectedStage)
      : [];
  }

  getAcademicYearLabel(grade: Grade): string {
    return `${grade.name} ${grade.stage === 'ثانوية' ? 'ثانوي' : 'اعدادي'}`;
  }

  get filteredCourses(): Course[] {
    // No grade/year filter: show all courses
    if (!this.selectedAcademicYear) {
      return this.courses;
    }
    // Filter by academicYear (e.g. "2 ثانوي")
    return this.courses.filter(c => c.academicYear === this.selectedAcademicYear);
  }

  selectStage(stage: 'اعدادية' | 'ثانوية') {
    this.selectedStage = stage;
    this.selectedAcademicYear = null; // Reset grade selection on stage change
  }

  selectGrade(grade: Grade) {
    this.selectedAcademicYear = this.getAcademicYearLabel(grade);
  }

  resetFilters() {
    this.selectedStage = null;
    this.selectedAcademicYear = null;
  }

  viewCourse(course: Course) {
    alert('تفاصيل الكورس: ' + course.subject);
  }
}