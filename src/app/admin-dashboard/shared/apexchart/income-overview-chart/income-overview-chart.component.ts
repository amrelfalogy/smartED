// ✅ UPDATE: income-overview-chart.component.ts - Better fallback handling
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
    const hasData = this.data.length > 0 && this.data.some(val => val > 0);
    const chartLabels = hasData ? this.labels : ['لا توجد بيانات'];
    const chartData = hasData ? this.data : [0];

    this.chartOptions = {
      chart: { 
        type: 'bar', 
        height: 365, 
        toolbar: { show: false }, 
        background: 'transparent' 
      },
      plotOptions: { 
        bar: { 
          columnWidth: '45%', 
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        } 
      },
      dataLabels: { 
        enabled: true,
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ['#666']
        },
        formatter: function (val) {
          return Number(val) > 0 ? val.toLocaleString() : '';
        }
      },
      series: [{ 
        name: 'الإيرادات (جنيه)', 
        data: chartData
      }],
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: chartLabels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { 
          style: { 
            colors: chartLabels.map(() => '#666'),
            fontSize: '11px'
          } 
        }
      },
      yaxis: { 
        show: true, 
        labels: { 
          style: { colors: ['#666'] },
          formatter: function (val) {
            return val > 0 ? val.toLocaleString() : '0';
          }
        } 
      },
      colors: [this.color],
      grid: { 
        show: true,
        borderColor: '#f0f0f0',
        strokeDashArray: 3
      },
      tooltip: { 
        theme: 'light',
        y: {
          formatter: function (val) {
            return val.toLocaleString() + ' جنيه';
          }
        }
      }
    };
  }
}