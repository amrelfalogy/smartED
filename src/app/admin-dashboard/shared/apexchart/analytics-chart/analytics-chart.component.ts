// ✅ UPDATE: analytics-chart.component.ts - Better Arabic labels
import { Component, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexTooltip, ApexStroke, ApexPlotOptions, ApexGrid } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: any;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  colors: string[];
};

@Component({
  selector: 'app-analytics-chart',
  templateUrl: './analytics-chart.component.html',
  styleUrls: ['./analytics-chart.component.css']
})
export class AnalyticsChartComponent implements OnChanges {
  @ViewChild('chart') chart!: ChartComponent;

  @Input() title: string = 'تقارير المستخدمين';
  @Input() categories: string[] = [];
  @Input() seriesName: string = 'تسجيلات';
  @Input() data: number[] = [];
  @Input() color: string = '#FFB814';

  public chartOptions: Partial<ChartOptions> = {};

  ngOnChanges(_: SimpleChanges): void {
    this.chartOptions = {
      chart: { 
        type: 'line', 
        height: 340, 
        toolbar: { show: false }, 
        background: 'transparent',
        fontFamily: 'Arial, sans-serif'
      },
      plotOptions: { 
        bar: { columnWidth: '45%', borderRadius: 4 } 
      },
      colors: [this.color],
      stroke: { 
        curve: 'smooth', 
        width: 3,
        lineCap: 'round'
      },
      grid: { 
        strokeDashArray: 4, 
        borderColor: '#f5f5f5',
        xaxis: {
          lines: {
            show: true
          }
        }
      },
      series: [{ 
        name: this.seriesName, 
        data: this.data.length ? this.data : [0] 
      }],
      xaxis: {
        type: 'category',
        categories: this.categories.length ? this.categories : ['لا توجد بيانات'],
        labels: { 
          style: { 
            colors: new Array(this.categories.length || 1).fill('#666'),
            fontSize: '11px'
          } 
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: { 
        show: true,
        labels: {
          style: {
            colors: ['#666']
          },
          formatter: function (val) {
            return Math.floor(val).toString();
          }
        }
      },
      tooltip: { 
        theme: 'light',
        y: {
          formatter: function (val) {
            return Math.floor(val) + ' تسجيل';
          }
        }
      }
    };
  }
}