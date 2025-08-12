import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesAdminListComponent } from './courses-admin-list.component';

describe('CoursesAdminListComponent', () => {
  let component: CoursesAdminListComponent;
  let fixture: ComponentFixture<CoursesAdminListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoursesAdminListComponent]
    });
    fixture = TestBed.createComponent(CoursesAdminListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
