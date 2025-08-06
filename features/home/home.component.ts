import { Component } from '@angular/core';
import { Course, Instructor } from 'src/app/core/models/entities.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  courses: Course[] = [
    {
      id: 1,
      image: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      instructor: 'أ. محمد علي',
      subject: 'مقدمة في البرمجة',
      academicYear: 'الثالث الثانوي',
      instructorImg: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      rating: 4
    },
    {
      id: 2,
      image: 'https://lms.rocket-soft.org/store/934/A-Z%20Web%20Programming.jpg',
      instructor: 'أ. محمد علي',
      subject: 'التصميم الجرافيكي',
      academicYear: 'الثالث الثانوي',
      instructorImg: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      rating: 3
    },
    {
      id: 3,
      image: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      instructor: 'أ. محمد علي',
      subject: 'التسويق الرقمي',
      academicYear: 'الثالث الثانوي',
      instructorImg: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      rating: 5
    },
    {
      id: 4,
      image: 'https://lms.rocket-soft.org/store/934/A-Z%20Web%20Programming.jpg',
      instructor: 'أ. محمد علي',
      subject: 'فيزياء متقدمة',
      academicYear: 'الثالث الثانوي',
      instructorImg: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      rating: 2
    },
    {
      id: 5,
      image: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      instructor: 'أ. محمد علي',
      subject: 'علم الأحياء',
      academicYear: 'الثالث الثانوي',
      instructorImg: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      rating: 3
    }
  ];

  instructors: Instructor[] = [
    {
      id: 1,
      name: 'د. أحمد محمد الشريف',
      photo: 'https://lms.rocket-soft.org/store/934/A-Z%20Web%20Programming.jpg',
      specialization: 'علوم الحاسوب والذكاء الاصطناعي',
      experience: 8,
      rating: 5,
      bio: 'أستاذ مساعد في قسم علوم الحاسوب مع خبرة واسعة في الذكاء الاصطناعي',
      department: 'كلية الحاسوب والمعلومات'
    },
    {
      id: 2,
      name: 'د. فاطمة علي النجار',
      photo: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      specialization: 'الرياضيات التطبيقية',
      experience: 12,
      rating: 5,
      bio: 'أستاذ مشارك في قسم الرياضيات مع تخصص في التحليل العددي',
      department: 'كلية العلوم'
    },
    {
      id: 3,
      name: 'د. خالد حسن المطيري',
      photo: 'https://lms.rocket-soft.org/store/934/A-Z%20Web%20Programming.jpg',
      specialization: 'الفيزياء النظرية',
      experience: 15,
      rating: 4,
      bio: 'أستاذ في قسم الفيزياء مع بحوث في فيزياء الجسيمات',
      department: 'كلية العلوم'
    },
    {
      id: 4,
      name: 'د. مريم سالم الزهراني',
      photo: 'https://lms.rocket-soft.org/store/1015/office_bundle.jpg',
      specialization: 'التاريخ الإسلامي والحضارة',
      experience: 10,
      rating: 5,
      bio: 'أستاذ مساعد في قسم التاريخ مع تخصص في الحضارة الإسلامية',
      department: 'كلية الآداب'
    }
  ];
}