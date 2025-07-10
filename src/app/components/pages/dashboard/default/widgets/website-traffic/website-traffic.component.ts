import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from "../../../../../../shared/components/ui/card/card.component";
import { SvgIconComponent } from "../../../../../../shared/components/ui/svg-icon/svg-icon.component";
import { cardToggleOptions4 } from "../../../../../../shared/data/common";

@Component({
  selector: 'app-website-traffic',
  imports: [ NgApexchartsModule, CardComponent, SvgIconComponent, CardComponent ],
  templateUrl: './website-traffic.component.html',
  styleUrl: './website-traffic.component.scss'
})

export class WebsiteTrafficComponent {

  public cardToggleOption = cardToggleOptions4;
  websiteTrafficChart: any = {
    series: [
      {
        name: 'Active',
        data: [18, 10, 65, 18, 28, 10],
      },
      {
        name: 'Bounce',
        data: [25, 50, 30, 30, 25, 45],
      },
    ],
    chart: {
      type: 'bar',
      height: 270,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 6,
      colors: ['transparent'],
    },
    grid: {
      show: true,
      borderColor: 'var(--chart-border)',
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    colors: ['#FFA941', 'var(--theme-default)'],
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      tickAmount: 4,
      tickPlacement: 'between',
      labels: {
        style: {
          fontFamily: 'Rubik, sans-serif',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      tickPlacement: 'between',
      labels: {
        style: {
          fontFamily: 'Rubik, sans-serif',
        },
      },
    },
    fill: {
      opacity: 1,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Rubik, sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      labels: {
        colors: 'var(--chart-text-color)',
      },
      markers: {
        size: 3,
        shape: 'circle',
        strokeWidth: 0,
      },
      itemMargin: {
        horizontal: 10,
      },
    },
    responsive: [
      {
        breakpoint: 1639,
        options: {
          chart: {
            height: 255,
          },
        },
      },
      {
        breakpoint: 1400,
        options: {
          chart: {
            height: 240,
          },
          xaxis: {
            tickAmount: 3,
            tickPlacement: 'between',
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '80%',
            },
          },
        },
      },
      {
        breakpoint: 1007,
        options: {
          chart: {
            height: 195,
          },
        },
      },
      {
        breakpoint: 992,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '70%',
            },
          },
        },
      },
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '30%',
            },
          },
          xaxis: {
            tickAmount: 6,
          },
        },
      },
      {
        breakpoint: 576,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '60%',
            },
          },
          grid: {
            padding: {
              right: 5,
            },
          },
        },
      },
    ],
  };

}
