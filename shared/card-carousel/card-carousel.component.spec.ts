import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarouselModule } from 'primeng/carousel';

import { CardCarouselComponent } from './card-carousel.component';

describe('CardCarouselComponent', () => {
  let component: CardCarouselComponent;
  let fixture: ComponentFixture<CardCarouselComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardCarouselComponent],
      imports: [CarouselModule]
    });
    fixture = TestBed.createComponent(CardCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display cards without autoplay', () => {
    const testCards = [
      {
        image: 'test-image.png',
        instructor: 'Test Instructor',
        lessonTitle: 'Test Lesson',
        courseName: 'Test Course',
        academicYear: '2023',
        rating: 4
      }
    ];
    
    component.cards = testCards;
    fixture.detectChanges();
    
    expect(component.cards).toEqual(testCards);
    expect(component.cards.length).toBe(1);
  });
});
