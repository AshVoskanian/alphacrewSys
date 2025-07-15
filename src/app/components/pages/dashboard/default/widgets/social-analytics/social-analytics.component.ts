import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from "../../../../../../shared/components/ui/card/card.component";
import { SocialAnalytics } from "../../../../../../shared/interface/dashboard";

@Component({
  selector: 'app-social-analytics',
  imports: [ NgApexchartsModule, CardComponent, CardComponent, CardComponent ],
  templateUrl: './social-analytics.component.html',
  styleUrl: './social-analytics.component.scss'
})

export class SocialAnalyticsComponent {

  public activeTab: string = 'birmingham';


  socialAnalytics: SocialAnalytics = {
    marker: [
      {
        title: 'Total',
        color: 'primary'
      },
      {
        title: 'Confirmed',
        color: 'success'
      },
      {
        title: 'Other',
        color: 'secondary'
      }
    ],
    charts: [
      {
        value: 'birmingham',
        chart_details: {
          series: [
            {
              name: "Total",
              data: [ 10, 25, 42, 54, 12, 59, 37 ],
            },
            {
              name: "Confirmed",
              data: [ 20, 15, 35, 25, 42, 54, 73 ],
            },
            {
              name: "Other",
              data: [ 25, 33, 15, 10, 25, 42, 19 ],
            },
          ],
          chart: {
            type: "bar",
            height: 350,
            toolbar: {
              show: false,
            },
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: "60%",
            },
          },
          dataLabels: {
            enabled: false,
          },
          stroke: {
            show: true,
            width: 2,
            colors: [ "transparent" ],
          },
          colors: [
            "var(--bs-primary)",
            "var(--bs-success)",
            "var(--bs-secondary)"
          ],
          xaxis: {
            categories: [
              "15 Jul, Tue",
              "16 Jul, Wed",
              "17 Jul, Thu",
              "18 Jul, Fri",
              "19 Jul, Sat",
              "20 Jul, Sun",
              "21 Jul, Mon"
            ],
            tickPlacement: "between",
            labels: {
              style: {
                fontFamily: "Helvetica, sans-serif",
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
            min: 10,
            max: 80,
            labels: {
              formatter: function(val: string) {
                return val + "k";
              },
              style: {
                colors: "#52526C",
                fontSize: "12px",
                fontFamily: "Helvetica, sans-serif",
                fontWeight: 400,
              },
            },
          },
          fill: {
            opacity: 1,
          },
          legend: {
            show: false,
          },
          grid: {
            show: true,
            position: "back",
            borderColor: "var(--chart-border)",
          },
          responsive: [
            {
              breakpoint: 446,
              options: {
                xaxis: {
                  type: "category",
                  tickAmount: 5,
                  tickPlacement: "between",
                },
              },
            },
            {
              breakpoint: 808,
              options: {
                chart: {
                  height: 360,
                },
              },
            },
          ]
        }
      },
      {
        value: 'bristol',
        chart_details: {
          series: [
            {
              name: "Total",
              data: [ 10, 25, 42, 54, 12, 59, 37 ],
            },
            {
              name: "Confirmed",
              data: [ 20, 15, 35, 25, 42, 54, 73 ],
            },
            {
              name: "Other",
              data: [ 25, 33, 15, 10, 25, 42, 19 ],
            },
          ],
          chart: {
            type: "bar",
            height: 350,
            toolbar: {
              show: false,
            },
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: "60%",
            },
          },
          dataLabels: {
            enabled: false,
          },
          stroke: {
            show: true,
            width: 2,
            colors: [ "transparent" ],
          },
          colors: [
            "var(--bs-primary)",
            "var(--bs-success)",
            "var(--bs-secondary)"
          ],
          xaxis: {
            categories: [
              "15 Jul, Tue",
              "16 Jul, Wed",
              "17 Jul, Thu",
              "18 Jul, Fri",
              "19 Jul, Sat",
              "20 Jul, Sun",
              "21 Jul, Mon"
            ],
          },
          yaxis: {
            min: 10,
            max: 80,
            labels: {
              formatter: function(val: string) {
                return val + "k";
              },
              style: {
                colors: "#52526C",
                fontSize: "12px",
                fontFamily: "Helvetica, sans-serif",
                fontWeight: 400,
              },
            },
          },
          fill: {
            opacity: 1,
          },
          legend: {
            show: false,
          },
          grid: {
            show: true,
            borderColor: "var(--chart-border)",
          },
          responsive: [
            {
              breakpoint: 446,
              options: {
                xaxis: {
                  type: "category",
                  tickAmount: 5,
                  tickPlacement: "between",
                },
              },
            },
          ],
        }
      },
    ]
  }

  socialAnalyticsTab: any[] = [
    {
      id: 1,
      title: 'Birmingham',
      value: 'birmingham',
      icon: 'location-arrow',
      bg_color: 'danger',
      icon_color: 'youtube-color'
    },
    {
      id: 2,
      title: 'Bristol',
      value: 'bristol',
      icon: 'location-arrow',
      bg_color: 'primary',
      icon_color: 'bg-primary',
      class: 'text-light'
    }
  ]

  handleTab(value: string) {
    this.activeTab = value;
  }

}
