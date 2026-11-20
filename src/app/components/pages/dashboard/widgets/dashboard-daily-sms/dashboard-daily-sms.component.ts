import { afterNextRender, Component, computed, DestroyRef, inject, Injector, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbAccordionModule, NgbPopover, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { Select2Module, Select2UpdateEvent, Select2UpdateValue } from 'ng-select2-component';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { finalize } from 'rxjs';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { PhoneInputComponent } from '../../../../../shared/components/ui/phone-input/phone-input.component';
import { DashboardDaySms } from '../../../../../shared/interface/dashboard';
import { GeneralService } from '../../../../../shared/services/general.service';
import { RegionsService } from '../../../../../shared/services/regions.service';

interface DaySmsRow extends DashboardDaySms {
  rowId: number;
  selected: boolean;
  editor: Editor;
}

type ContactEditFields = {
  onsiteContact: string;
  onsiteEmail: string;
  onsitePhone: string;
  onsitePhoneSecondary: string;
};

@Component({
  selector: 'app-dashboard-daily-sms',
  imports: [
    CardComponent,
    FormsModule,
    ReactiveFormsModule,
    NgbAccordionModule,
    NgbPopoverModule,
    NgxEditorModule,
    Select2Module,
    PhoneInputComponent,
  ],
  templateUrl: './dashboard-daily-sms.component.html',
  styleUrl: './dashboard-daily-sms.component.scss'
})
export class DashboardDailySmsComponent extends ApiBase implements OnInit, OnDestroy {
  private readonly _dr = inject(DestroyRef);
  private readonly _injector = inject(Injector);
  private readonly _fb = inject(FormBuilder);
  private readonly _regionsService = inject(RegionsService);

  loading = signal(false);
  sending = signal(false);
  savingContact = signal(false);
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

  readonly contactForm = this._fb.group({
    onsiteContact: [ '', [ Validators.maxLength(200) ] ],
    onsiteEmail: [ '', [ Validators.email, Validators.maxLength(254) ] ],
    onsitePhone: [ null as string | null ],
    onsitePhoneSecondary: [ null as string | null ],
  });

  private contactPopoverInitial: ContactEditFields = {
    onsiteContact: '',
    onsiteEmail: '',
    onsitePhone: '',
    onsitePhoneSecondary: '',
  };
  private activeContactPopover: NgbPopover | null = null;
  private editingRow: DaySmsRow | null = null;

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
    const status = this.displayStatus(row).toLowerCase();
    return this.hasPhoneNumber(row) && status !== 'sent' && status !== 'missing';
  }

  displayStatus(row: DaySmsRow): string {
    if (this.areBothContactsMissing(row)) {
      return 'Missing';
    }

    return (row.status ?? '').trim() || '—';
  }

  statusClass(status?: string): string {
    const normalized = (status ?? '').trim().toLowerCase();
    if (normalized === 'sent') {
      return 'badge-light-success';
    }
    if (normalized.startsWith('pending')) {
      return 'badge-light-warning';
    }
    if (normalized === 'missing') {
      return 'badge-missing';
    }
    if (normalized === 'not sent') {
      return 'badge-light-danger';
    }
    return '';
  }

  onContactEditClick(row: DaySmsRow, popover: NgbPopover, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (popover.isOpen()) {
      this.activeContactPopover = null;
      this.editingRow = null;
      popover.close();
      return;
    }

    if (this.activeContactPopover && this.activeContactPopover !== popover) {
      this.activeContactPopover.close();
    }

    this.editingRow = row;
    this.prepareContactPopover(row);
    this.activeContactPopover = popover;
    popover.open();

    afterNextRender(
      () => {
        queueMicrotask(() => {
          const el = document.querySelector<HTMLInputElement>(
            '.daily-sms-contact-popover input[name="onsiteContactDraft"]'
          );
          el?.focus();
          el?.select();
        });
      },
      { injector: this._injector }
    );
  }

  onContactPopoverHidden(): void {
    this.activeContactPopover = null;
    this.editingRow = null;
    this.contactForm.reset({
      onsiteContact: '',
      onsiteEmail: '',
      onsitePhone: null,
      onsitePhoneSecondary: null,
    }, { emitEvent: false });
  }

  commitContactFromPopover(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.persistContactFromPopover();
  }

  onContactInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.persistContactFromPopover();
    }
  }

  private prepareContactPopover(row: DaySmsRow): void {
    this.contactPopoverInitial = {
      onsiteContact: (row.onsiteContact ?? '').trim(),
      onsiteEmail: (row.onsiteEmail ?? '').trim(),
      onsitePhone: (row.primaryContact ?? '').trim(),
      onsitePhoneSecondary: (row.secondaryContact ?? '').trim(),
    };
    this.contactForm.reset({
      onsiteContact: this.contactPopoverInitial.onsiteContact,
      onsiteEmail: this.contactPopoverInitial.onsiteEmail,
      onsitePhone: this.contactPopoverInitial.onsitePhone || null,
      onsitePhoneSecondary: this.contactPopoverInitial.onsitePhoneSecondary || null,
    }, { emitEvent: false });
  }

  private persistContactFromPopover(): void {
    const row = this.editingRow;
    const popover = this.activeContactPopover;
    if (!row || row.jobPartId == null || !popover) {
      return;
    }

    if (this.contactForm.invalid) {
      GeneralService.markFormGroupTouched(this.contactForm);
      return;
    }

    const raw = this.contactForm.getRawValue();
    const next: ContactEditFields = {
      onsiteContact: (raw.onsiteContact ?? '').trim(),
      onsiteEmail: (raw.onsiteEmail ?? '').trim(),
      onsitePhone: (raw.onsitePhone ?? '').trim(),
      onsitePhoneSecondary: (raw.onsitePhoneSecondary ?? '').trim(),
    };
    const initial = this.contactPopoverInitial;

    if (
      next.onsiteContact === initial.onsiteContact &&
      next.onsiteEmail === initial.onsiteEmail &&
      next.onsitePhone === initial.onsitePhone &&
      next.onsitePhoneSecondary === initial.onsitePhoneSecondary
    ) {
      popover.close();
      return;
    }

    this.savingContact.set(true);
    this.contactForm.disable({ emitEvent: false });

    this.get<unknown>('Schedule/UpdateJobPartOnsiteContact', {
      jobPartId: row.jobPartId,
      onsiteContact: next.onsiteContact,
      onsiteEmail: next.onsiteEmail,
      onsitePhone: next.onsitePhone,
      onsitePhoneSecondary: next.onsitePhoneSecondary,
    })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => {
          this.savingContact.set(false);
          this.contactForm.enable({ emitEvent: false });
        })
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          row.onsiteContact = next.onsiteContact;
          row.onsiteEmail = next.onsiteEmail;
          row.primaryContact = next.onsitePhone;
          row.secondaryContact = next.onsitePhoneSecondary;
          row.selected = row.selected && this.isRowSelectable(row);

          GeneralService.showSuccessMessage('Onsite contact saved');
          this.rows.set(this.sortRows([ ...this.rows() ]));
          popover.close();
        },
        error: () => {
          GeneralService.showErrorMessage('Could not save onsite contact');
        },
      });
  }

  private areBothContactsMissing(row: DaySmsRow): boolean {
    return !this.hasPhoneNumber(row);
  }

  private hasPhoneNumber(row: DaySmsRow): boolean {
    return [ row.primaryContact, row.secondaryContact ]
      .some((value) => /\d/.test((value ?? '').trim()));
  }

  private statusSortOrder(status: string): number {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'missing') {
      return 0;
    }
    if (normalized === 'not sent') {
      return 1;
    }
    if (normalized.startsWith('pending')) {
      return 2;
    }
    if (normalized === 'sent') {
      return 3;
    }
    return 4;
  }

  private sortRows(rows: DaySmsRow[]): DaySmsRow[] {
    return [ ...rows ].sort((a, b) => {
      const statusDiff = this.statusSortOrder(this.displayStatus(a)) - this.statusSortOrder(this.displayStatus(b));
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return (a.client ?? '').localeCompare(b.client ?? '', undefined, { sensitivity: 'base' });
    });
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
      onsiteEmail: row.onsiteEmail ?? '',
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

          const mappedRows = (res.data ?? []).map((item, index) => ({
            rowId: index + 1,
            jobId: item.jobId,
            jobPartId: item.jobPartId,
            client: item.client ?? '',
            onsiteContact: item.onsiteContact ?? '',
            onsiteEmail: item.onsiteEmail ?? '',
            primaryContact: item.primaryContact ?? '',
            secondaryContact: item.secondaryContact ?? '',
            sms: item.sms ?? '',
            status: item.status?.trim() || '',
            selected: false,
            editor: new Editor(),
          }));

          this.rows.set(this.sortRows(mappedRows));
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
