import { Component, DestroyRef, inject, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { TableClickedAction, TableConfigs } from '../../../../../shared/interface/common';
import { DashboardWarning, StrikeModel } from '../../../../../shared/interface/dashboard';
import { GeneralService } from '../../../../../shared/services/general.service';
import { WarningAddUpdateComponent } from './warning-add-update/warning-add-update.component';

@Component({
  selector: 'app-dashboard-warnings',
  imports: [CardComponent, TableComponent, WarningAddUpdateComponent],
  templateUrl: './dashboard-warnings.component.html',
  styleUrl: './dashboard-warnings.component.scss'
})
export class DashboardWarningsComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _modal = inject(NgbModal);

  @ViewChild('addUpdateWarning') addUpdateWarning!: TemplateRef<unknown>;

  loading = signal(false);
  modalLoading = signal(false);
  selectedWarning = signal<DashboardWarning | null>(null);

  private addEditModalRef?: NgbModalRef;

  public tableConfig: TableConfigs = {
    columns: [
      { title: 'ID', field_value: 'jobId', sort: true, type: 'link' },
      { title: 'Name', field_value: 'name', sort: true },
      { title: 'CrewID', field_value: 'crewId', sort: true },
      { title: 'Warning Date', field_value: 'strikeDate', sort: true, type: 'date' },
      { title: 'Severity', field_value: 'text', sort: true },
      { title: 'Reason', field_value: 'strikeReason', sort: true }
    ],
    row_action: [
      {
        label: 'Edit',
        icon: 'fa-solid fa-pen txt-primary',
        class: 'square-white',
        action_to_perform: 'edit',
        modal: true,
        model_text: 'Are you sure you want to delete this job part?'
      }
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

          this.tableConfig.data = (res.data ?? []).map((warning: DashboardWarning) => ({
            ...warning,
            id: warning.strikeId
          }));
        }
      });
  }

  openAddModal() {
    this.selectedWarning.set(null);
    this.addEditModalRef = this._modal.open(this.addUpdateWarning, { centered: true, size: 'lg' });
  }

  handleTableAction(event: TableClickedAction) {
    if (event.action_to_perform !== 'edit' || !event.data) {
      return;
    }

    this.selectedWarning.set(event.data as DashboardWarning);
    this.addEditModalRef = this._modal.open(this.addUpdateWarning, { centered: true, size: 'lg' });
  }

  closeAddUpdateModal(data: StrikeModel | null) {
    if (!data) {
      this.addEditModalRef?.close();
      return;
    }

    this.saveStrike(data);
  }

  saveStrike(strike: StrikeModel) {
    if (this.modalLoading()) {
      return;
    }

    this.modalLoading.set(true);

    const payload: StrikeModel = { ...strike };
    GeneralService.clearObject(payload);

    this.post<StrikeModel>('Dashboard/AddOrUpdateStrike', payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.modalLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.addEditModalRef?.close();
          GeneralService.showSuccessMessage();
          this.getWarnings();
        }
      });
  }
}
