import { Component, computed, DestroyRef, inject, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { finalize } from 'rxjs';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { ConfirmModalComponent } from '../../../../../shared/components/ui/confirm-modal/confirm-modal.component';
import { DashboardLockTimeSheetsRequest } from '../../../../../shared/interface/dashboard';
import { GeneralService } from '../../../../../shared/services/general.service';
import { RegionsService } from '../../../../../shared/services/regions.service';

interface CrewTimeSheetMailRequest {
  crewId: number;
  month: number;
  year: number;
  regionIds: string;
}

type TimesheetConfirmAction = 'email' | 'lock';

@Component({
  selector: 'app-dashboard-timesheet',
  imports: [CardComponent, ReactiveFormsModule, Select2Module, ConfirmModalComponent],
  templateUrl: './dashboard-timesheet.component.html',
  styleUrl: './dashboard-timesheet.component.scss'
})
export class DashboardTimesheetComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private readonly _modal = inject(NgbModal);
  private readonly _regionsService = inject(RegionsService);

  @ViewChild('confirmModal') confirmModal!: TemplateRef<unknown>;

  form!: FormGroup;
  lockLoading = signal(false);
  emailLoading = signal(false);
  confirmTitle = signal('');
  confirmAction = signal<TimesheetConfirmAction | null>(null);

  private confirmModalRef?: NgbModalRef;

  regions = toSignal(this._regionsService.regions, { initialValue: [] });
  regionOptions = computed(() =>
    (this.regions() ?? []).filter((region): region is Select2Option =>
      'value' in region && region.label !== 'All'
    )
  );

  years: Select2Option[] = [];
  months: Select2Option[] = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ];

  ngOnInit() {
    this.initYears();
    this.initForm();
  }

  initYears() {
    const currentYear = new Date().getFullYear();

    this.years = [
      { label: String(currentYear - 1), value: currentYear - 1 },
      { label: String(currentYear), value: currentYear },
      { label: String(currentYear + 1), value: currentYear + 1 }
    ];
  }

  initForm() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const defaultMonth = currentDay < 21
      ? (currentMonth === 1 ? 12 : currentMonth - 1)
      : currentMonth;

    this.form = this._fb.group({
      regions: [[], this.requiredRegions],
      year: [now.getFullYear(), Validators.required],
      month: [defaultMonth, Validators.required]
    });
  }

  requestSendEmail() {
    if (this.emailLoading() || this.lockLoading()) {
      return;
    }

    if (!this.validateRegions()) {
      return;
    }

    this.openConfirmModal('email');
  }

  requestLockTimesheets() {
    if (this.lockLoading() || this.emailLoading()) {
      return;
    }

    if (!this.validateRegions()) {
      return;
    }

    this.openConfirmModal('lock');
  }

  openConfirmModal(action: TimesheetConfirmAction) {
    this.confirmAction.set(action);
    this.confirmTitle.set(this.buildConfirmTitle(action));
    this.confirmModalRef = this._modal.open(this.confirmModal, { centered: true, size: 'md' });
  }

  closeConfirmModal(result: 'ok' | 'cancel') {
    if (result !== 'ok') {
      this.confirmModalRef?.close();
      this.confirmAction.set(null);
      return;
    }

    const action = this.confirmAction();

    if (action === 'email') {
      this.sendEmail();
      return;
    }

    if (action === 'lock') {
      this.lockTimesheets();
    }
  }

  private sendEmail() {
    const { year, month, regionIds } = this.getFormPayload();
    const payload: CrewTimeSheetMailRequest = {
      crewId: 0,
      year,
      month,
      regionIds
    };

    this.emailLoading.set(true);

    this.post('Crew/SendCrewTimeSheetsByMail', payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => {
          this.emailLoading.set(false);
          this.confirmModalRef?.close();
          this.confirmAction.set(null);
        })
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('Timesheets emailed successfully');
        }
      });
  }

  private lockTimesheets() {
    const payload: DashboardLockTimeSheetsRequest = this.getFormPayload();

    this.lockLoading.set(true);

    this.post('Dashboard/LockTimeSheets', payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => {
          this.lockLoading.set(false);
          this.confirmModalRef?.close();
          this.confirmAction.set(null);
        })
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('Timesheets locked successfully');
        }
      });
  }

  private buildConfirmTitle(action: TimesheetConfirmAction): string {
    const { year, month } = this.form.getRawValue();
    const monthLabel = this.months.find(item => item.value === +month)?.label ?? month;
    const regionNames = this.getSelectedRegionNames();
    const actionLabel = action === 'email' ? 'Email' : 'Lock';

    return `${actionLabel} ${monthLabel} ${year} Timesheets for ${regionNames}?`;
  }

  private getSelectedRegionNames(): string {
    const selectedIds = (this.form.get('regions')?.value ?? []) as Array<string | number>;
    const options = this.regionOptions();

    return selectedIds
      .map(id => options.find(option => option.value === id || String(option.value) === String(id))?.label)
      .filter((label): label is string => !!label)
      .join(', ');
  }

  private validateRegions(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      GeneralService.showErrorMessage('Please select at least one region');
      return false;
    }

    return true;
  }

  private getFormPayload(): DashboardLockTimeSheetsRequest {
    const { regions, year, month } = this.form.getRawValue();

    return {
      regionIds: (regions as Array<string | number>).join(','),
      year: +year,
      month: +month
    };
  }

  private readonly requiredRegions = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  };
}
