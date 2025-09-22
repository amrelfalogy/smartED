import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeGeneratorModalComponent } from './code-generator-modal.component';

describe('CodeGeneratorModalComponent', () => {
  let component: CodeGeneratorModalComponent;
  let fixture: ComponentFixture<CodeGeneratorModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CodeGeneratorModalComponent]
    });
    fixture = TestBed.createComponent(CodeGeneratorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
