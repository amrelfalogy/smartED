import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyBarChartComponent } from './monthly-bar-chart.component';

describe('MonthlyBarChartComponent', () => {
  let component: MonthlyBarChartComponent;
  let fixture: ComponentFixture<MonthlyBarChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MonthlyBarChartComponent]
    });
    fixture = TestBed.createComponent(MonthlyBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
