import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePictureUploadComponent } from './profile-picture-upload.component';

describe('ProfilePictureUploadComponent', () => {
  let component: ProfilePictureUploadComponent;
  let fixture: ComponentFixture<ProfilePictureUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfilePictureUploadComponent]
    });
    fixture = TestBed.createComponent(ProfilePictureUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
