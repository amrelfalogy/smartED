import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivationCodesComponent } from './activation-codes.component';

describe('ActivationCodesComponent', () => {
  let component: ActivationCodesComponent;
  let fixture: ComponentFixture<ActivationCodesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivationCodesComponent]
    });
    fixture = TestBed.createComponent(ActivationCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
