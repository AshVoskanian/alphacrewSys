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
  regionId = signal(0);
  commsDate = signal(this.toDateInputValue(new Date()));
  rows = signal<DaySmsRow[]>([]);

  regions = toSignal(this._regionsService.regions, { initialValue: [] });

  allSelected = computed(() => {
    const items = this.rows();
    return items.length > 0 && items.every((row) => row.selected);
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
      row.selected = checked;
    });
    this.rows.set([...this.rows()]);
  }

  toggleRow(rowId: number, checked: boolean, event?: Event): void {
    event?.stopPropagation();
    const row = this.rows().find((item) => item.rowId === rowId);
    if (!row) {
      return;
    }

    row.selected = checked;
    this.rows.set([...this.rows()]);
  }

  sendSelected(): void {
    // Send service is not available yet.
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
              client: item.client ?? '',
              onsiteContact: item.onsiteContact ?? '',
              primaryContact: item.primaryContact ?? '',
              secondaryContact: item.secondaryContact ?? '',
              sms: item.sms ?? '',
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
