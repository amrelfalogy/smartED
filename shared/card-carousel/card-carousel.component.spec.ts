import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardCarouselComponent, CarouselCard } from './card-carousel.component';

describe('CardCarouselComponent', () => {
  let component: CardCarouselComponent;
  let fixture: ComponentFixture<CardCarouselComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardCarouselComponent]
    });
    fixture = TestBed.createComponent(CardCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should implement OnInit interface properly', () => {
    expect(component.ngOnInit).toBeDefined();
    expect(typeof component.ngOnInit).toBe('function');
  });

  it('should initialize with empty cards array', () => {
    expect(component.cards).toEqual([]);
  });

  it('should accept cards input', () => {
    const testCards: CarouselCard[] = [
      {
        image: 'test.jpg',
        instructor: 'Test Instructor',
        lessonTitle: 'Test Lesson',
        courseName: 'Test Course',
        academicYear: '2023',
        rating: 5
      }
    ];
    
    component.cards = testCards;
    fixture.detectChanges();
    
    expect(component.cards).toEqual(testCards);
    expect(component.cards.length).toBe(1);
  });
});
