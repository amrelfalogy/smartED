import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeOverviewChartComponent } from './income-overview-chart.component';

describe('IncomeOverviewChartComponent', () => {
  let component: IncomeOverviewChartComponent;
  let fixture: ComponentFixture<IncomeOverviewChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IncomeOverviewChartComponent]
    });
    fixture = TestBed.createComponent(IncomeOverviewChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
