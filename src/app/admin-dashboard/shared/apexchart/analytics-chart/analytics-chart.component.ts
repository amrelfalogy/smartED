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

  public chartOptions: Partial<ChartOptions> = {
    chart: { type: 'line', height: 340, toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
    colors: ['#FFB814'],
    stroke: { curve: 'smooth', width: 2 },
    grid: { strokeDashArray: 4, borderColor: '#f5f5f5' },
    series: [{ name: 'تسجيلات', data: [] }],
    xaxis: { type: 'category', categories: [], labels: { style: { colors: [] as any } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { show: true },
    tooltip: { theme: 'light' }
  };

  ngOnChanges(_: SimpleChanges): void {
    this.chartOptions = {
      ...this.chartOptions,
      colors: [this.color],
      series: [{ name: this.seriesName, data: this.data }],
      xaxis: {
        ...this.chartOptions.xaxis,
        type: 'category',
        categories: this.categories,
        labels: { style: { colors: new Array(this.categories.length).fill('#222') } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      }
    };
  }
}