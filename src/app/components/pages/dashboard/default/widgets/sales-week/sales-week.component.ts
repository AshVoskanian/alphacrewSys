import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';


@Component({
  selector: 'app-sales-week',
  imports: [ NgApexchartsModule ],
  templateUrl: './sales-week.component.html',
  styleUrl: './sales-week.component.scss'
})

export class SalesWeekComponent {

  salesWeekChart: any = {
    chart: {
      height: 500,
      type: "heatmap",
      toolbar: { show: false },
      offsetY: -20,
    },
    colors: [ "#F1F0FF", "#7366FF", "#AAA2FE", "#E6E7FD" ],
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.9,
      },
    },
    dataLabels: { enabled: false },
    series: this.generateHourlyData(14), // 14 დღიანი სერიები
    xaxis: {
      categories: this.getNextDays(14), // მომდევნო 14 დღის სახელები
      tickPlacement: "between",
      labels: {
        style: {
          fontFamily: "Rubik, sans-serif",
          colors: "#52526c",
          fontSize: 12,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: {
          fontFamily: "Rubik, sans-serif",
          colors: "#52526c",
          fontSize: 12,
        },
      },
    },
    responsive: [
      {
        breakpoint: 1400,
        options: {
          chart: { height: 400 },
          xaxis: { tickAmount: 7, tickPlacement: "between" },
        },
      },
    ],
  }

// იღებს მომდევნო N დღის სახელებს
  getNextDays(days: number) {
    const arr: string[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    return arr;
  }

// ქმნის 24 სერიას თითო საათისთვის
  generateHourlyData(days: number) {
    const series = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourLabel = hour.toString().padStart(2, "0") + ":00";
      const row = {
        name: hourLabel,
        data: []
      };

      for (let d = 0; d < days; d++) {
        const value = Math.floor(Math.random() * 100); // აქ რეალური მონაცემი ჩასვი
        row.data.push({ x: (d + 1).toString(), y: value });
      }

      series.push(row);
    }
    return series;
  }
}
