import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderLeftComponent } from './header-left.component';

describe('HeaderLeftComponent', () => {
  let component: HeaderLeftComponent;
  let fixture: ComponentFixture<HeaderLeftComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderLeftComponent]
    });
    fixture = TestBed.createComponent(HeaderLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
