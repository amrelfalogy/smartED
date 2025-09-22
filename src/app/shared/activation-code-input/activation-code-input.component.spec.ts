import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivationCodeInputComponent } from './activation-code-input.component';

describe('ActivationCodeInputComponent', () => {
  let component: ActivationCodeInputComponent;
  let fixture: ComponentFixture<ActivationCodeInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivationCodeInputComponent]
    });
    fixture = TestBed.createComponent(ActivationCodeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
