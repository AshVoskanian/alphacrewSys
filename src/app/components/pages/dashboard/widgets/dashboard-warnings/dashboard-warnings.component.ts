import { Component, DestroyRef, inject, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { TableConfigs } from '../../../../../shared/interface/common';
import { DashboardWarning, StrikeModel } from '../../../../../shared/interface/dashboard';
import { GeneralService } from '../../../../../shared/services/general.service';
import { WarningAddUpdateComponent } from './warning-add-update/warning-add-update.component';

@Component({
  selector: 'app-dashboard-warnings',
  imports: [CardComponent, TableComponent, WarningAddUpdateComponent, ReactiveFormsModule],
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
  searchControl = new FormControl('', { nonNullable: true });

  private addEditModalRef?: NgbModalRef;

  public tableConfig: TableConfigs = {
    columns: [
      { title: 'Name', field_value: 'name', sort: true, type: 'action' },
      { title: 'CrewID', field_value: 'crewId', sort: true },
      { title: 'Warning Date', field_value: 'strikeDate', sort: true, type: 'date', min_width: 150 },
      { title: 'Severity', field_value: 'text', sort: true },
      { title: 'Reason', field_value: 'strikeReason', sort: true }
    ],
    data: [] as DashboardWarning[]
  };

  ngOnInit() {
    this.getWarnings();
    this.watchSearch();
  }

  watchSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this._dr)
      )
      .subscribe(() => this.getWarnings());
  }

  getWarnings() {
    this.loading.set(true);

    this.post<Array<DashboardWarning>>('Dashboard/GetDashboardWarnings', {
      warningId: 0,
      page: 0,
      search: this.searchControl.value.trim()
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

  openEditModal(warning: DashboardWarning) {
    if (!warning) {
      return;
    }

    this.selectedWarning.set(warning);
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
