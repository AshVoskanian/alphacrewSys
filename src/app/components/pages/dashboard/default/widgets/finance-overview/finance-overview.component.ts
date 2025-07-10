import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from "../../../../../../shared/components/ui/card/card.component";
import { primaryColor } from "../../../../../../shared/data/common";

@Component({
  selector: 'app-finance-overview',
  imports: [ NgApexchartsModule, CardComponent, CardComponent ],
  templateUrl: './finance-overview.component.html',
  styleUrl: './finance-overview.component.scss'
})

export class FinanceOverviewComponent {

  financeOverviewChart: any = {
    title: 'Finance Overview',
    revenue: '634k',
    expenses: '302k',
    series: [
      {
        name: "Expenses",
        data: [20, 45, 40, 50, 65, 18, 25, 60, 35, 25, 60, 30],
      },
      {
        name: "Revenue",
        data: [40, 82, 90, 40, 99, 55, 15, 35, 95, 20, 20, 30],
      },
    ],
    chart: {
      type: "bar",
      height: 230,
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 0,
      },
    },
    grid: {
      show: false,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
      dashArray: 0,
      lineCap: "butt",
      colors: "#fff",
    },
    fill: {
      opacity: 1,
    },
    legend: {
      show: false,
    },

    colors: [primaryColor, "#AAAFCB"],
    yaxis: {
      min: 20,
      max: 100,
      tickAmount: 4,
      tickPlacement: "on",

      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", " Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      labels: {
        style: {
          fontFamily: "Rubik, sans-serif",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 1200,
        options: {
          chart: {
            height: 235,
          },
        },
      },
      {
        breakpoint: 875,
        options: {
          xaxis: {
            tickAmount: 6,
            tickPlacement: "between",
          },
        },
      },
      {
        breakpoint: 767,
        options: {
          plotOptions: {
            bar: {
              columnWidth: "15px",
            },
          },
        },
      },
      {
        breakpoint: 576,
        options: {
          plotOptions: {
            bar: {
              columnWidth: "8px",
            },
          },
        },
      },
      {
        breakpoint: 400,
        options: {
          plotOptions: {
            bar: {
              columnWidth: "6px",
            },
          },
        },
      },
    ]
  }

}
