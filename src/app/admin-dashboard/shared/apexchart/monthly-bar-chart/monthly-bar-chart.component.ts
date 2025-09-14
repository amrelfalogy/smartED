import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-monthly-bar-chart',
  templateUrl: './monthly-bar-chart.component.html',
  styleUrls: ['./monthly-bar-chart.component.css']
})
export class MonthlyBarChartComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;

  @Input() weekCategories: string[] = [];
  @Input() weekData: number[] = [];
  @Input() monthCategories: string[] = [];
  @Input() monthData: number[] = [];
  @Input() title: string = 'الإيراد اليومي';

  chartOptions!: Partial<ApexOptions>;
  private currentView: 'week' | 'month' = 'week';

  ngOnInit() {
    setTimeout(() => document.querySelector('.chart-income.week')?.classList.add('active'));
    this.buildOptions('week');
  }

  toggleActive(value: 'week' | 'month') {
    this.currentView = value;
    this.buildOptions(value);
    if (value === 'month') {
      document.querySelector('.chart-income.month')?.classList.add('active');
      document.querySelector('.chart-income.week')?.classList.remove('active');
    } else {
      document.querySelector('.chart-income.week')?.classList.add('active');
      document.querySelector('.chart-income.month')?.classList.remove('active');
    }
  }

  private buildOptions(view: 'week' | 'month') {
    const categories = view === 'week'
      ? (this.weekCategories.length ? this.weekCategories : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
      : (this.monthCategories.length ? this.monthCategories : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']);

    const data = view === 'week'
      ? (this.weekData.length ? this.weekData : [0, 0, 0, 0, 0, 0, 0])
      : (this.monthData.length ? this.monthData : [0,0,0,0,0,0,0,0,0,0,0,0]);

    this.chartOptions = {
      chart: { height: 450, type: 'area', toolbar: { show: false }, background: 'transparent' },
      dataLabels: { enabled: false },
      colors: ['#1677ff'],
      series: [{ name: 'الإيراد (جنيه)', data }],
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories,
        labels: { style: { colors: (categories || []).map(() => '#8c8c8c') } },
        axisBorder: { show: true, color: '#f0f0f0' }
      },
      yaxis: {
        labels: { style: { colors: ['#8c8c8c'] } }
      },
      grid: { strokeDashArray: 0, borderColor: '#f5f5f5' },
      theme: { mode: 'light' }
    };
  }
}