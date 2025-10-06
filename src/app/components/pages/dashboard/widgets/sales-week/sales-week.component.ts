import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApiBase } from "../../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../../../shared/services/general.service";
import { CrewByHour } from "../../../../../shared/interface/dashboard";


@Component({
  selector: 'app-sales-week',
  imports: [ NgApexchartsModule ],
  templateUrl: './sales-week.component.html',
  styleUrl: './sales-week.component.scss'
})

export class SalesWeekComponent extends ApiBase implements OnInit {
  private _dr = inject(DestroyRef);

  crewByHour;

  loading = signal(false);

  ngOnInit() {
    this.getCrewByHour();
  }

  initChartData(data: Array<CrewByHour>) {
    const crew = data.map((crew: CrewByHour) => crew.crew);

    this.crewByHour = {
      chart: {
        height: 500,
        type: "heatmap",
        toolbar: { show: false },
        offsetY: -20,
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 1,
          colorScale: {
            ranges: [
              { from: 0, to: 30, color: '#B3E5FC', name: 'Low' },
              { from: 31, to: 70, color: '#03A9F4', name: 'Medium' },
              { from: 71, to: Math.max(...crew), color: '#0D47A1', name: 'High' },
            ]
          }
        },
      },
      dataLabels: { enabled: false },
      series: this.generateSeriesFromRealData(data),
      xaxis: {
        categories: this.getNextDays(14),
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
  generateSeriesFromRealData(data: any[]) {
    const series = [];

    // პირველ რიგში 24 საათისთვის ციკლი
    for (let hour = 0; hour < 24; hour++) {
      const hourLabel = hour.toString().padStart(2, "0") + ":00";
      const row = {
        name: hourLabel,
        data: []
      };

      // ყველა დღის მონაცემში გავაკეთოთ შესაბამისი საათის მოძებნა
      data.forEach((item) => {
        const itemHour = new Date(item.times).getHours();
        const day = new Date(item.times).getDate(); // ან (d+1) რომ სერიის x იყოს
        if (itemHour === hour) {
          row.data.push({ x: day.toString(), y: item.crew });
        }
      });

      series.push(row);
    }

    return series.reverse(); // თუ გინდა, რომ 23:00–დან 00:00-მდე იყოს
  }

  getCrewByHour() {
    this.loading.set(true);

    this.get<Array<CrewByHour>>('Dashboard/GetDashboardCrewByHour')
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.initChartData(res.data);
          this.loading.set(false);
        }
      })
  }
}
