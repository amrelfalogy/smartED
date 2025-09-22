// ✅ UPDATE: sales-report-chart.component.ts - Add total calculation
import { Component, ViewChild, Input, OnChanges } from '@angular/core';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-sales-report-chart',
  templateUrl: './sales-report-chart.component.html',
  styleUrls: ['./sales-report-chart.component.css']
})
export class SalesReportChartComponent implements OnChanges {
  @ViewChild('chart') chart!: ChartComponent;

  @Input() categories: string[] = [];      
  @Input() revenueSeries: number[] = [];   
  @Input() countSeries: number[] = [];     

  chartOptions!: Partial<ApexOptions>;

  ngOnChanges(): void {
    this.chartOptions = {
      chart: { 
        type: 'bar', 
        height: 430, 
        toolbar: { show: false }, 
        background: 'transparent' 
      },
      plotOptions: { 
        bar: { 
          columnWidth: '30%', 
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        } 
      },
      stroke: { show: true, width: 8, colors: ['transparent'] },
      dataLabels: { 
        enabled: true,
        style: {
          colors: ['#333']
        },
        formatter: function (val) {
          return val.toLocaleString() + ' جنيه';
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        show: true,
        offsetX: 10,
        offsetY: 10,
        itemMargin: { horizontal: 15, vertical: 5 },
        labels: {
          colors: ['#333']
        }
      },
      series: [
        { 
          name: 'الإيراد (جنيه)', 
          data: this.revenueSeries.length ? this.revenueSeries : [0] 
        },
        ...(this.countSeries.length ? [{ 
          name: 'عدد المدفوعات', 
          data: this.countSeries 
        }] : [])
      ],
      xaxis: {
        categories: this.categories.length ? this.categories : ['لا توجد بيانات'],
        labels: { 
          style: { 
            colors: (this.categories.length ? this.categories : ['لا توجد بيانات']).map(() => '#666'),
            fontSize: '12px'
          } 
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#666']
          },
          formatter: function (val) {
            return val.toLocaleString();
          }
        }
      },
      tooltip: { 
        theme: 'light',
        y: {
          formatter: function (val, { seriesIndex }) {
            if (seriesIndex === 0) {
              return val.toLocaleString() + ' جنيه';
            }
            return val.toLocaleString() + ' مدفوعة';
          }
        }
      },
      colors: ['#1677ff', '#faad14'],
      grid: { 
        borderColor: '#f5f5f5',
        strokeDashArray: 3
      }
    };
  }

  // ✅ NEW: Calculate total revenue for display
  getTotalRevenue(): string {
    const total = this.revenueSeries.reduce((sum, val) => sum + val, 0);
    return `${total.toLocaleString()} جنيه`;
  }
}