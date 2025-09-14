import { Component, ViewChild, Input, OnChanges } from '@angular/core';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-sales-report-chart',
  templateUrl: './sales-report-chart.component.html',
  styleUrls: ['./sales-report-chart.component.css']
})
export class SalesReportChartComponent implements OnChanges {
  @ViewChild('chart') chart!: ChartComponent;

  @Input() categories: string[] = [];      // ['lesson','monthly','semester']
  @Input() revenueSeries: number[] = [];   // revenue by type
  @Input() countSeries: number[] = [];     // counts by type (optional)

  chartOptions!: Partial<ApexOptions>;

  ngOnChanges(): void {
    this.chartOptions = {
      chart: { type: 'bar', height: 430, toolbar: { show: false }, background: 'transparent' },
      plotOptions: { bar: { columnWidth: '30%', borderRadius: 4 } },
      stroke: { show: true, width: 8, colors: ['transparent'] },
      dataLabels: { enabled: false },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        show: true,
        offsetX: 10,
        offsetY: 10,
        itemMargin: { horizontal: 15, vertical: 5 }
      },
      series: [
        { name: 'الإيراد (جنيه)', data: this.revenueSeries.length ? this.revenueSeries : [0] },
        ...(this.countSeries.length ? [{ name: 'عدد المدفوعات', data: this.countSeries }] : [])
      ],
      xaxis: {
        categories: this.categories.length ? this.categories : ['—'],
        labels: { style: { colors: (this.categories.length ? this.categories : ['—']).map(() => '#222') } }
      },
      tooltip: { theme: 'light' },
      colors: ['#1677ff', '#faad14'],
      grid: { borderColor: '#f5f5f5' }
    };
  }
}