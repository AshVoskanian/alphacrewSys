import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';


@Component({
  selector: 'app-sales-week',
  imports: [NgApexchartsModule],
  templateUrl: './sales-week.component.html',
  styleUrl: './sales-week.component.scss'
})

export class SalesWeekComponent {

  salesWeekChart: any = {
    chart: {
      height: 325,
      type: "heatmap",
      toolbar: {
        show: false,
      },
      offsetY: -20,
    },
    colors: ["#F1F0FF", "#7366FF", "#AAA2FE", "#E6E7FD"],
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.9,
      },
    },
    dataLabels: {
      enabled: false,
    },
    series: [
      {
        name: "1pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
      {
        name: "2pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
      {
        name: "3pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
      {
        name: "4pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
      {
        name: "5pm",
        data: this.generateData(7, {
          min: 0,
          max: 0,
        }),
      },
      {
        name: "6pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
      {
        name: "7pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
      {
        name: "8pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
      {
        name: "9pm",
        data: this.generateData(7, {
          min: -30,
          max: 55,
        }),
      },
    ],
    xaxis: {
      categories: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      tickPlacement: "between",
      labels: {
        style: {
          fontFamily: "Rubik, sans-serif",
          colors: "#52526c",
          fontSize: 12,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
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
        breakpoint: 1580,
        options: {
          chart: {
            height: 340,
          },
        },
      },
      {
        breakpoint: 1510,
        options: {
          xaxis: {
            tickAmount: 3,
            tickPlacement: "between",
          },
        },
      },
      {
        breakpoint: 1459,
        options: {
          chart: {
            height: 310,
          },
        },
      },
      {
        breakpoint: 1431,
        options: {
          chart: {
            height: 360,
          },
        },
      },
      {
        breakpoint: 1400,
        options: {
          chart: {
            height: 268,
          },
          xaxis: {
            tickAmount: 5,
            tickPlacement: "between",
          },
        },
      },
    ]
  }
  generateData(count: number, yRange: { min: any; max: any; }) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = (i + 1).toString();
      var y = Math.floor(Math.random() * (yRange.max - yRange.min + 1)) + yRange.min;

      series.push({
        x: x,
        y: y,
      });
      i++;
    }
    return series;
  }
}
