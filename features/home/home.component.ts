import { Component } from '@angular/core';
import { CarouselCard } from '../../shared/card-carousel/card-carousel.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  cards: CarouselCard[] = [
    {
      image: 'assets/imgs/Model2.png',
      instructor: 'أ. محمد علي',
      lessonTitle: 'درس البرمجة الأول',
      courseName: 'مقدمة في البرمجة',
      academicYear: '2 ثانوي',
      rating: 4
    },
    {
      image: 'assets/imgs/Model2.png',
      instructor: 'أ. محمد علي',
      lessonTitle: 'أساسيات التصميم',
      courseName: 'التصميم الجرافيكي',
      academicYear: '3 ثانوي',
      rating: 3
    },
    {
      image: 'assets/imgs/Model2.png',
      instructor: 'أ. محمد علي',
      lessonTitle: 'مقدمة في التسويق',
      courseName: 'التسويق الرقمي',
      academicYear: '2 ثانوي',
      rating: 5
    },
    {
      image: 'assets/imgs/Model2.png',
      instructor: 'أ. محمد علي',
      lessonTitle: 'الفيزياء الحديثة',
      courseName: 'فيزياء متقدمة',
      academicYear: '3 ثانوي',
      rating: 2
    },
    {
      image: 'assets/imgs/Model2.png',
      instructor: 'أ. محمد علي',
      lessonTitle: 'الأحياء المتقدمة',
      courseName: 'علم الأحياء',
      academicYear: '2 ثانوي',
      rating: 3
    }
  ];
}