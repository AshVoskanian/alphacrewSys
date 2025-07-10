import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from "../../../../../../shared/components/ui/card/card.component";

@Component({
  selector: 'app-social-analytics',
  imports: [ NgApexchartsModule, CardComponent, CardComponent, CardComponent ],
  templateUrl: './social-analytics.component.html',
  styleUrl: './social-analytics.component.scss'
})

export class SocialAnalyticsComponent {

  public activeTab: string = 'youtube';


  socialAnalytics: any = {
    marker: [
      {
        title: 'Followers',
        color: 'primary'
      },
      {
        title: 'Comments',
        color: 'secondary'
      },
      {
        title: 'Likes',
        color: 'success'
      }
    ],
    charts: [
      {
        value: 'youtube',
        chart_details: {
          series: [
            {
              name: "Followers",
              data: [58, 29, 39, 19, 75, 58, 32, 67, 50, 22, 44, 49],
            },
            {
              name: "Comments",
              data: [45, 69, 32, 70, 45, 32, 50, 40, 45, 60, 40, 45],
            },
            {
              name: "Likes",
              data: [18, 39, 60, 30, 18, 40, 35, 50, 18, 30, 25, 60],
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
            colors: ["transparent"],
          },
          colors: ["var(--theme-default)", "#AAAFCB", "#65c15c"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            tickPlacement: "between",
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
          yaxis: {
            min: 10,
            max: 80,
            labels: {
              formatter: function (val: string) {
                return val + "k";
              },
              style: {
                colors: "#52526C",
                fontSize: "12px",
                fontFamily: "Rubik, sans-serif",
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
        value: 'facebook',
        chart_details: {
          series: [
            {
              name: "Followers",
              data: [10, 25, 25, 30, 12, 26, 10, 16, 40, 35, 20, 21],
            },
            {
              name: "Comments",
              data: [20, 15, 35, 17, 47, 36, 25, 13, 14, 45, 48, 36],
            },
            {
              name: "Likes",
              data: [25, 33, 15, 12, 16, 34, 45, 20, 24, 33, 44, 21],
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
            colors: ["transparent"],
          },
          colors: ["var(--theme-default)", "#AAAFCB", "#65c15c"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          },
          yaxis: {
            min: 10,
            max: 80,
            labels: {
              formatter: function (val: string) {
                return val + "k";
              },
              style: {
                colors: "#52526C",
                fontSize: "12px",
                fontFamily: "Rubik, sans-serif",
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
      {
        value: 'instagram',
        chart_details: {
          series: [
            {
              name: "Followers",
              data: [58, 29, 39, 19, 75, 58, 32, 67, 50, 22, 44, 49],
            },
            {
              name: "Comments",
              data: [45, 69, 32, 70, 45, 32, 50, 40, 45, 60, 40, 45],
            },
            {
              name: "Likes",
              data: [18, 39, 60, 30, 18, 40, 35, 50, 18, 30, 25, 60],
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
            colors: ["transparent"],
          },
          colors: ["var(--theme-default)", "#AAAFCB", "#65c15c"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          },
          yaxis: {
            min: 10,
            max: 80,
            labels: {
              formatter: function (val: string) {
                return val + "k";
              },
              style: {
                colors: "#52526C",
                fontSize: "12px",
                fontFamily: "Rubik, sans-serif",
                fontWeight: 400,
              },
            },
          },
          grid: {
            show: true,
            borderColor: "var(--chart-border)",
          },
          fill: {
            opacity: 1,
          },
          legend: {
            show: false,
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
          ]
        }
      },
      {
        value: 'linkedin',
        chart_details: {
          series: [
            {
              name: "Followers",
              data: [56, 40, 35, 12, 16, 34, 50, 12, 18, 21, 18, 28],
            },
            {
              name: "Comments",
              data: [20, 10, 14, 26, 35, 44, 35, 17, 15, 29, 35, 48],
            },
            {
              name: "Likes",
              data: [16, 35, 50, 35, 68, 49, 25, 14, 12, 30, 47, 18],
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
            colors: ["transparent"],
          },
          colors: ["var(--theme-default)", "#AAAFCB", "#65c15c"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          },
          yaxis: {
            min: 10,
            max: 80,
            labels: {
              formatter: function (val: string) {
                return val + "k";
              },
              style: {
                colors: "#52526C",
                fontSize: "12px",
                fontFamily: "Rubik, sans-serif",
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
          ]
        }
      },
      {
        value: 'twitter',
        chart_details: {
          series: [
            {
              name: "Followers",
              data: [56, 46, 35, 12, 16, 34, 62, 34, 65, 35, 18, 28],
            },
            {
              name: "Comments",
              data: [20, 10, 14, 26, 35, 44, 35, 17, 65, 29, 35, 48],
            },
            {
              name: "Likes",
              data: [16, 35, 78, 35, 68, 49, 25, 14, 12, 30, 47, 18],
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
            colors: ["transparent"],
          },
          colors: ["var(--theme-default)", "#AAAFCB", "#65c15c"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          },
          yaxis: {
            min: 10,
            max: 80,
            labels: {
              formatter: function (val: string) {
                return val + "k";
              },
              style: {
                colors: "#52526C",
                fontSize: "12px",
                fontFamily: "Rubik, sans-serif",
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
          ]
        }
      }
    ]
  }

  socialAnalyticsTab: any[] = [
    {
      id: 1,
      title: 'Youtube',
      value: 'youtube',
      icon: 'youtube',
      bg_color: 'danger',
      icon_color: 'youtube-color'
    },
    {
      id: 2,
      title: 'Facebook',
      value: 'facebook',
      icon: 'facebook-f',
      bg_color: 'primary',
      icon_color: 'bg-primary',
      class: 'text-light'
    },
    {
      id: 3,
      title: 'Instagram',
      value: 'instagram',
      icon: 'instagram',
      bg_color: 'warning',
      icon_color: 'instagram-color',
      class: 'text-light'
    },
    {
      id: 4,
      title: 'Linkedin',
      value: 'linkedin',
      icon: 'linkedin-in',
      bg_color: 'info',
      icon_color: 'bg-info',
      class: 'text-light'
    },
    {
      id: 5,
      title: 'X (Twitter)',
      value: 'twitter',
      icon: 'x-twitter',
      bg_color: 'secondary',
      icon_color: 'bg-dark',
      class: 'text-light'
    }
  ]

  handleTab(value: string) {
    this.activeTab = value;
  }

}
