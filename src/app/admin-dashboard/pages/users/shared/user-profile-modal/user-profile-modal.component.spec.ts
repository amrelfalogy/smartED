import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileModalComponent } from './user-profile-modal.component';

describe('UserProfileModalComponent', () => {
  let component: UserProfileModalComponent;
  let fixture: ComponentFixture<UserProfileModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfileModalComponent]
    });
    fixture = TestBed.createComponent(UserProfileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
