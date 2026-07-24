import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { TableConfigs } from '../../../../../shared/interface/common';
import { DashboardDataIssue } from '../../../../../shared/interface/dashboard';
import { GeneralService } from '../../../../../shared/services/general.service';

@Component({
  selector: 'app-dashboard-data-issues',
  imports: [CardComponent, TableComponent],
  templateUrl: './dashboard-data-issues.component.html',
  styleUrl: './dashboard-data-issues.component.scss'
})
export class DashboardDataIssuesComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);

  loading = signal(false);

  public tableConfig: TableConfigs = {
    columns: [
      { title: 'Name', field_value: 'recordName', sort: true },
      { title: 'Area', field_value: 'area', sort: true },
      { title: 'Issue', field_value: 'issue', sort: true },
      { title: 'Bad Value', field_value: 'postcode', sort: true, type: 'date' },
    ],
    data: [] as DashboardDataIssue[]
  };

  ngOnInit() {
    this.getDataIssues();
  }

  getDataIssues() {
    this.loading.set(true);

    this.post<DashboardDataIssue[]>('Dashboard/GetDashboardDataIssues', null)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = (res.data ?? []).map((item, index) => ({
            ...item,
            id: item.recordId || index
          }));
        }
      });
  }
}
