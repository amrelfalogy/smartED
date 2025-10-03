import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubeSecurePlayerComponent } from './youtube-secure-player.component';

describe('YoutubeSecurePlayerComponent', () => {
  let component: YoutubeSecurePlayerComponent;
  let fixture: ComponentFixture<YoutubeSecurePlayerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [YoutubeSecurePlayerComponent]
    });
    fixture = TestBed.createComponent(YoutubeSecurePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
