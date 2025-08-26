import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormArrayComponent } from './dynamic-form-array.component';

describe('DynamicFormArrayComponent', () => {
  let component: DynamicFormArrayComponent;
  let fixture: ComponentFixture<DynamicFormArrayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DynamicFormArrayComponent]
    });
    fixture = TestBed.createComponent(DynamicFormArrayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
