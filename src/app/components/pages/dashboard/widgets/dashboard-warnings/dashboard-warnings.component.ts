import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { TableConfigs } from '../../../../../shared/interface/common';
import { DashboardWarning } from '../../../../../shared/interface/dashboard';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeneralService } from '../../../../../shared/services/general.service';

@Component({
  selector: 'app-dashboard-warnings',
  imports: [CardComponent, TableComponent],
  templateUrl: './dashboard-warnings.component.html',
  styleUrl: './dashboard-warnings.component.scss'
})
export class DashboardWarningsComponent extends ApiBase implements OnInit {
  private _dr = inject(DestroyRef);

  loading = signal(false);

  public tableConfig: TableConfigs = {
    columns: [
      { title: 'ID', field_value: 'jobId', sort: true, type: 'link' },
      { title: 'Name', field_value: 'name', sort: true },
      { title: 'Company', field_value: 'companyName', sort: true },
      { title: 'Type', field_value: 'text', sort: true },
      { title: 'Reason', field_value: 'strikeReason', sort: true },
      { title: 'Date', field_value: 'strikeDate', sort: true, type: 'date' },
      { title: 'Venue', field_value: 'venueName', sort: true },
      { title: 'Created By', field_value: 'createBy', sort: true },
    ],
    data: [] as DashboardWarning[]
  };

  ngOnInit() {
    this.getWarnings();
  }

  getWarnings() {
    this.loading.set(true);

    this.post<Array<DashboardWarning>>('Dashboard/GetDashboardWarnings', {
      warningId: 0,
      page: 0,
      search: ''
    })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.map((warning: DashboardWarning) => ({
            ...warning,
            id: warning.strikeId
          }));
          this.loading.set(false);
        }
      });
  }
}
