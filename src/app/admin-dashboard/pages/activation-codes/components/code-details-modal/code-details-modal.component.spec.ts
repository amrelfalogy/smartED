import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeDetailsModalComponent } from './code-details-modal.component';

describe('CodeDetailsModalComponent', () => {
  let component: CodeDetailsModalComponent;
  let fixture: ComponentFixture<CodeDetailsModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CodeDetailsModalComponent]
    });
    fixture = TestBed.createComponent(CodeDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
