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
    { id: 1, image: 'assets/imgs/Model2.png', instructor: 'أ. محمد علي', subject: 'مقدمة في البرمجة', academicYear: 'الثانية ثانوي', rating: 4, description: 'تعلم أساسيات البرمجة من الصفر', duration: '30 ساعة', studentsCount: 120 },
    { id: 2, image: 'assets/imgs/Model2.png', instructor: 'أ. سارة أحمد', subject: 'التصميم الجرافيكي', academicYear: 'الثالثة ثانوي', rating: 3, description: 'أساسيات التصميم الجرافيكي', duration: '20 ساعة', studentsCount: 85 },
    { id: 3, image: 'assets/imgs/Model2.png', instructor: 'أ. عمر حسن', subject: 'التسويق الرقمي', academicYear: 'الثانية ثانوي', rating: 5, description: 'مقدمة في التسويق الرقمي', duration: '25 ساعة', studentsCount: 110 },
    { id: 4, image: 'assets/imgs/Model2.png', instructor: 'أ. ليلى محمود', subject: 'فيزياء متقدمة', academicYear: 'الثالثة ثانوي', rating: 2, description: 'مفاهيم الفيزياء الحديثة والمتقدمة', duration: '40 ساعة', studentsCount: 60 },
    { id: 5, image: 'assets/imgs/Model2.png', instructor: 'أ. كريم سعد', subject: 'علم الأحياء', academicYear: 'الثانية ثانوي', rating: 3, description: 'أساسيات علم الأحياء', duration: '22 ساعة', studentsCount: 77 },
    { id: 6, image: 'assets/imgs/Model2.png', instructor: 'أ. فاطمة محمود', subject: 'لغة عربية', academicYear: 'الأولى اعدادي', rating: 5, description: 'شرح شامل للغة العربية', duration: '18 ساعة', studentsCount: 180 },
    { id: 7, image: 'assets/imgs/Model2.png', instructor: 'أ. أحمد سمير', subject: 'رياضيات', academicYear: 'الأولى ثانوي', rating: 4, description: 'أساسيات الرياضيات للثانوي', duration: '35 ساعة', studentsCount: 95 },
    { id: 8, image: 'assets/imgs/Model2.png', instructor: 'أ. نورا علي', subject: 'كيمياء', academicYear: 'الثانية اعدادي', rating: 4, description: 'أساسيات الكيمياء', duration: '28 ساعة', studentsCount: 92 },
    { id: 9, image: 'assets/imgs/Model2.png', instructor: 'أ. هشام محمد', subject: 'تاريخ', academicYear: 'الثالثة اعدادي', rating: 3, description: 'تاريخ مصر والعالم', duration: '24 ساعة', studentsCount: 105 }
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
    // No filters applied: show all courses
    if (!this.selectedStage && !this.selectedAcademicYear) {
      return this.courses;
    }

    // Filter by stage only
    if (this.selectedStage && !this.selectedAcademicYear) {
      const stageFilter = this.selectedStage === 'ثانوية' ? 'ثانوي' : 'اعدادي';
      return this.courses.filter(c => c.academicYear.includes(stageFilter));
    }

    // Filter by specific academic year
    if (this.selectedAcademicYear) {
      return this.courses.filter(c => c.academicYear === this.selectedAcademicYear);
    }

    return this.courses;
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
    // This will be replaced with router navigation to course details
    console.log('Viewing course:', course);
    alert('تفاصيل الكورس: ' + course.subject);
  }

  getStars(rating: number): number[] {
  return Array(5).fill(0).map((_, i) => i);
}
}