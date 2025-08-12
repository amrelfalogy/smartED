import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseTypeComponent } from './course-type.component';

describe('CourseTypeComponent', () => {
  let component: CourseTypeComponent;
  let fixture: ComponentFixture<CourseTypeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseTypeComponent]
    });
    fixture = TestBed.createComponent(CourseTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
