import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { TableConfigs } from '../../../../../shared/interface/common';
import { DashboardImportantDate } from '../../../../../shared/interface/dashboard';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeneralService } from '../../../../../shared/services/general.service';

@Component({
  selector: 'app-dashboard-important-dates',
  imports: [CardComponent, TableComponent],
  templateUrl: './dashboard-important-dates.component.html',
  styleUrl: './dashboard-important-dates.component.scss'
})
export class DashboardImportantDatesComponent extends ApiBase implements OnInit {
  private _dr = inject(DestroyRef);

  loading = signal(false);

  public tableConfig: TableConfigs = {
    columns: [
      { title: 'ID', field_value: 'jobId', sort: true, type: 'link' },
      { title: 'Client', field_value: 'companyName', sort: true },
      { title: 'Venue', field_value: 'venueName', sort: true },
      { title: 'Starts', field_value: 'startDate', sort: true, type: 'date' },
      { title: 'Parts', field_value: 'parts', sort: true },
      { title: 'Entered', field_value: 'editedBy', sort: true },
      { title: 'Ordered By', field_value: 'orderedBy', sort: true },
    ],
    data: [] as DashboardImportantDate[]
  };

  ngOnInit() {
    this.getImportantDates();
  }

  getImportantDates() {
    this.loading.set(true);

    this.get<Array<DashboardImportantDate>>('Dashboard/GetDashboardImportantDates')
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.map((item: DashboardImportantDate) => ({
            ...item,
            id: item.jobId
          }));
          this.loading.set(false);
        }
      });
  }
}
