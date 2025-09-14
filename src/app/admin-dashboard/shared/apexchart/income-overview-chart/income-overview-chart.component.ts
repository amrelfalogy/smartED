import { Component, ViewChild, OnInit, Input, OnChanges } from '@angular/core';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-income-overview-chart',
  templateUrl: './income-overview-chart.component.html',
  styleUrls: ['./income-overview-chart.component.css']
})
export class IncomeOverviewChartComponent implements OnInit, OnChanges {
  @ViewChild('chart') chart!: ChartComponent;

  @Input() title: string = 'نظرة عامة على الدخل';
  @Input() subtitle: string = 'حسب طريقة الدفع';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() color: string = '#5cdbd3';

  chartOptions!: Partial<ApexOptions>;

  ngOnInit() { this.buildOptions(); }
  ngOnChanges() { this.buildOptions(); }

  private buildOptions() {
    this.chartOptions = {
      chart: { type: 'bar', height: 365, toolbar: { show: false }, background: 'transparent' },
      plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      series: [{ name: 'الإيرادات (جنيه)', data: this.data.length ? this.data : [0] }],
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: this.labels.length ? this.labels : ['—'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: (this.labels.length ? this.labels : ['—']).map(() => '#8c8c8c') } }
      },
      yaxis: { show: true, labels: { style: { colors: ['#8c8c8c'] } } },
      colors: [this.color],
      grid: { show: false },
      tooltip: { theme: 'light' }
    };
  }
}