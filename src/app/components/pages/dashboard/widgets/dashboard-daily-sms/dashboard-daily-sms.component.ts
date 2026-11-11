import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { Select2Module, Select2UpdateEvent, Select2UpdateValue } from 'ng-select2-component';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { finalize } from 'rxjs';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { DashboardDaySms } from '../../../../../shared/interface/dashboard';
import { GeneralService } from '../../../../../shared/services/general.service';
import { RegionsService } from '../../../../../shared/services/regions.service';

interface DaySmsRow extends DashboardDaySms {
  rowId: number;
  selected: boolean;
  editor: Editor;
}

@Component({
  selector: 'app-dashboard-daily-sms',
  imports: [CardComponent, FormsModule, NgbAccordionModule, NgxEditorModule, Select2Module],
  templateUrl: './dashboard-daily-sms.component.html',
  styleUrl: './dashboard-daily-sms.component.scss'
})
export class DashboardDailySmsComponent extends ApiBase implements OnInit, OnDestroy {
  private readonly _dr = inject(DestroyRef);
  private readonly _regionsService = inject(RegionsService);

  loading = signal(false);
  sending = signal(false);
  regionId = signal(0);
  commsDate = signal(this.toDateInputValue(new Date()));
  rows = signal<DaySmsRow[]>([]);

  regions = toSignal(this._regionsService.regions, { initialValue: [] });

  selectableRows = computed(() => this.rows().filter((row) => this.isRowSelectable(row)));

  allSelected = computed(() => {
    const selectable = this.selectableRows();
    return selectable.length > 0 && selectable.every((row) => row.selected);
  });

  someSelected = computed(() => this.rows().some((row) => row.selected));

  selectedCount = computed(() => this.rows().filter((row) => row.selected).length);

  ngOnInit(): void {
    this.loadDaySms();
  }

  ngOnDestroy(): void {
    this.destroyEditors();
  }

  onDateChange(value: string): void {
    this.commsDate.set(value);
    this.loadDaySms();
  }

  onRegionChange(event: Select2UpdateEvent<Select2UpdateValue>): void {
    const nextRegionId = +(event.value ?? 0);
    if (nextRegionId === this.regionId()) {
      return;
    }

    this.regionId.set(nextRegionId);
    this.loadDaySms();
  }

  toggleSelectAll(checked: boolean): void {
    this.rows().forEach((row) => {
      row.selected = checked && this.isRowSelectable(row);
    });
    this.rows.set([...this.rows()]);
  }

  toggleRow(rowId: number, checked: boolean, event?: Event): void {
    event?.stopPropagation();
    const row = this.rows().find((item) => item.rowId === rowId);
    if (!row || !this.isRowSelectable(row)) {
      return;
    }

    row.selected = checked;
    this.rows.set([...this.rows()]);
  }

  isRowSelectable(row: DaySmsRow): boolean {
    const status = (row.status ?? '').trim().toLowerCase();
    return this.hasPhoneNumber(row) && status !== 'sent';
  }

  statusClass(status?: string): string {
    const normalized = (status ?? '').trim().toLowerCase();
    if (normalized === 'sent') {
      return 'badge-light-success';
    }
    if (normalized.startsWith('pending')) {
      return 'badge-light-warning';
    }
    if (normalized === 'not sent') {
      return 'badge-light-danger';
    }
    return '';
  }

  private hasPhoneNumber(row: DaySmsRow): boolean {
    return [ row.primaryContact, row.secondaryContact ]
      .some((value) => /\d/.test((value ?? '').trim()));
  }

  sendSelected(): void {
    const selectedRows = this.rows().filter((row) => row.selected && this.isRowSelectable(row));
    if (!selectedRows.length || this.sending()) {
      return;
    }

    const payload: DashboardDaySms[] = selectedRows.map((row) => ({
      jobId: row.jobId,
      jobPartId: row.jobPartId,
      status: row.status ?? '',
      client: row.client ?? '',
      onsiteContact: row.onsiteContact ?? '',
      primaryContact: row.primaryContact ?? '',
      secondaryContact: row.secondaryContact ?? '',
      sms: row.sms ?? '',
    }));

    this.sending.set(true);

    this.post('Dashboard/AddDaySmsInClienCommunication', payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.sending.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('SMS sent successfully');
          this.loadDaySms();
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to send SMS');
        },
      });
  }

  private loadDaySms(): void {
    const date = this.commsDate();
    if (!date) {
      return;
    }

    this.loading.set(true);

    this.get<DashboardDaySms[]>('Dashboard/GetDaySms', {
      regionId: this.regionId(),
      commsDate: `${date}T00:00:00.000`,
    })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.destroyEditors();

          this.rows.set(
            (res.data ?? []).map((item, index) => ({
              rowId: index + 1,
              jobId: item.jobId,
              jobPartId: item.jobPartId,
              client: item.client ?? '',
              onsiteContact: item.onsiteContact ?? '',
              primaryContact: item.primaryContact ?? '',
              secondaryContact: item.secondaryContact ?? '',
              sms: item.sms ?? '',
              status: item.status?.trim() || '',
              selected: false,
              editor: new Editor(),
            }))
          );
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to load daily SMS');
        },
      });
  }

  private destroyEditors(): void {
    this.rows().forEach((row) => row.editor?.destroy());
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
