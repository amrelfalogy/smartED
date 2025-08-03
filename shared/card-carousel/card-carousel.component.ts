import { Component, Input, OnInit } from '@angular/core';

export interface CarouselCard {
  image: string;
  instructor: string;
  lessonTitle: string;
  courseName: string;
  academicYear: string;
  rating: number;
}

@Component({
  selector: 'app-card-carousel',
  templateUrl: './card-carousel.component.html',
  styleUrls: ['./card-carousel.component.css']
})
export class CardCarouselComponent implements OnInit {

  @Input() cards: CarouselCard[] = [];

  ngOnInit() {
    console.log('Cards received by carousel:', this.cards);
  }
}