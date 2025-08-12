import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesReportChartComponent } from './sales-report-chart.component';

describe('SalesReportChartComponent', () => {
  let component: SalesReportChartComponent;
  let fixture: ComponentFixture<SalesReportChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalesReportChartComponent]
    });
    fixture = TestBed.createComponent(SalesReportChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
