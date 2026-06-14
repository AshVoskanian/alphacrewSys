import {
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  WritableSignal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableConfigs, TableColumn } from '../../../../../shared/interface/common';
import { CrewDetail, Timesheet } from '../../../../../shared/interface/crew';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GeneralService } from '../../../../../shared/services/general.service';
import { MONTHS, YEARS } from '../../../../../shared/utils/date';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

const PAY = 'table-column-muted';

const TIMESHEET_COLUMNS: TableColumn[] = [
  { title: 'Start', field_value: 'startDate', sort: true, type: 'date', min_width: 108 },
  { title: 'Company', field_value: 'companyName', sort: true, min_width: 112 },
  { title: 'Venue', field_value: 'venueName', sort: true, min_width: 150 },
  { title: 'Role', field_value: 'jobPartCrewRoleText', sort: true, min_width: 64 },
  { title: 'Booked\nHours', field_value: 'workHours', sort: true, type: 'template', min_width: 68 },
  { title: 'Booked Hours\n(£)', field_value: 'workPay', sort: true, type: 'price', decimal_number: true, min_width: 68, header_class: PAY, class: PAY },
  { title: 'Extra\nHours', field_value: 'extraHours', sort: true, type: 'template', min_width: 64 },
  { title: 'Extra Hours\n(£)', field_value: 'extraHoursPay', sort: true, type: 'price', decimal_number: true, min_width: 68, header_class: PAY, class: PAY },
  { title: 'Travel\nHours', field_value: 'travelHours', sort: true, type: 'template', min_width: 64 },
  { title: 'Travel Hours\n(£)', field_value: 'travelHoutsPay', sort: true, type: 'price', decimal_number: true, min_width: 68, header_class: PAY, class: PAY },
  { title: 'PD\n(£)', field_value: 'pd', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'Skill\n(£)', field_value: 'skilledPay', sort: true, type: 'price', decimal_number: true, min_width: 56, header_class: PAY, class: PAY },
  { title: 'OOT\n(£)', field_value: 'oot', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'Bonus\n(£)', field_value: 'bonus', sort: true, type: 'price', decimal_number: true, min_width: 56, header_class: PAY, class: PAY },
  { title: 'LNS\n(£)', field_value: 'lateNightShift', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'LMB\n(£)', field_value: 'lastMinutBonus', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'DRIVING\n(£)', field_value: 'drivingBonus', sort: true, type: 'price', decimal_number: true, min_width: 64, header_class: PAY, class: PAY },
  { title: 'ADJ\n(£)', field_value: 'adjustment', sort: true, type: 'template', min_width: 52, header_class: PAY, class: PAY },
  { title: 'TOTAL\n(£)', field_value: 'pay', sort: true, type: 'price', decimal_number: true, min_width: 58, header_class: PAY, class: PAY },
];

const TIMESHEET_TABLE_MIN_WIDTH = TIMESHEET_COLUMNS.reduce((sum, col) => sum + (col.min_width ?? 0), 0);

@Component({
  selector: 'app-crew-timesheets',
  imports: [ TableComponent, Select2Module, FormsModule, NgbTooltipModule, CommonModule ],
  templateUrl: './crew-timesheets.component.html',
  styleUrl: './crew-timesheets.component.scss'
})
export class CrewTimesheetsComponent extends ApiBase implements OnChanges, OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _fb: FormBuilder = inject(FormBuilder);

  crewDetail = input<CrewDetail>();

  today = signal(new Date());
  loading = signal<boolean>(false);
  emailLoading = signal<boolean>(false);
  years = signal<Select2Option[]>(YEARS);
  months = signal<Select2Option[]>(MONTHS);
  timesheetTableMinWidth = TIMESHEET_TABLE_MIN_WIDTH;
  currency = signal('£');

  tableConfig: WritableSignal<TableConfigs> = signal(
    {
      columns: TIMESHEET_COLUMNS,
      data: [] as Timesheet[]
    }
  );

  form: FormGroup;

  isTotalRow(details: Timesheet): boolean {
    return details.venueName?.toUpperCase() === 'TOTAL';
  }

  formatCurrency(value: number | null | undefined, currency?: string): string {
    const symbol = currency?.trim() || this.currency() || '£';
    return `${symbol}${Number(value ?? 0).toFixed(2)}`;
  }

  getCurrency(details?: Timesheet): string {
    return details?.timesheetCurrency?.trim() || this.currency() || '£';
  }

  private withCurrencyTitles(columns: TableColumn[], currency: string): TableColumn[] {
    return columns.map(col => ({
      ...col,
      title: col.title?.replace('(£)', `(${currency})`) ?? col.title
    }));
  }

  private resolveCurrency(items: Timesheet[]): string {
    return items.find(item => item.timesheetCurrency?.trim())?.timesheetCurrency?.trim() || '£';
  }

  getBookedHoursRateTooltip(details: Timesheet): string {
    return this.formatRateSum(details, details.crewPayrate, details.loyaltyBonus);
  }

  getExtraHoursRateTooltip(details: Timesheet): string {
    return this.formatRateSum(details, details.extraHourRate, details.loyaltyBonus);
  }

  getTravelHourRateTooltip(details: Timesheet): string {
    return this.formatCurrency(details.travelHourRate, details.timesheetCurrency);
  }

  getAdjustmentTooltip(details: Timesheet): string {
    return details.adjustmentTxt?.trim() ?? '';
  }

  private formatRateSum(details: Timesheet, ...values: number[]): string {
    const sum = values.reduce((total, value) => total + Number(value), 0);
    return this.formatCurrency(sum, details.timesheetCurrency);
  }

  private canShowRateSum(...values: (number | null | undefined)[]): boolean {
    if (values.some(value => value === null || value === undefined)) {
      return false;
    }

    return values.reduce((sum, value) => sum + Number(value), 0) > 0;
  }

  showBookedHoursInfo(details: Timesheet): boolean {
    return !this.isTotalRow(details) && this.canShowRateSum(details.crewPayrate, details.loyaltyBonus);
  }

  showExtraHoursInfo(details: Timesheet): boolean {
    return !this.isTotalRow(details) && this.canShowRateSum(details.extraHourRate, details.loyaltyBonus);
  }

  showTravelHoursInfo(details: Timesheet): boolean {
    if (this.isTotalRow(details) || details.travelHourRate === null || details.travelHourRate === undefined) {
      return false;
    }

    return Number(details.travelHourRate) > 0;
  }

  showAdjustmentInfo(details: Timesheet): boolean {
    return !this.isTotalRow(details) && !!details.adjustmentTxt?.trim();
  }

  ngOnInit() {
    this.initForm();
    this.setDate();
  }

  initForm() {
    this.form = this._fb.group({
      month: [ null, Validators.required ],
      year: [ null, Validators.required ]
    })
  }

  setDate() {
    this.form.patchValue({
      month: this.getCalculatedMonth(),
      year: this.today().getFullYear()
    });
  }

  getCalculatedMonth(): number {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    if (day >= 1 && day <= 21) {
      return month === 1 ? 12 : month - 1;
    } else {
      return month;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getTimesheets(this.crewDetail());
    }
  }

  getTimesheets(crewDetail: CrewDetail) {
    this.loading.set(true);
    const { crewId } = crewDetail;

    const params = {
      crewId,
      month: this.form?.get('month')?.value || this.getCalculatedMonth(),
      year: this.form?.get('year')?.value || this.today().getFullYear()
    }

    this.post<Timesheet[]>(`Crew/GetCrewTimeSheets`, params)
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

          const currency = this.resolveCurrency(res.data);
          this.currency.set(currency);

          this.tableConfig.update(config => ({
            ...config,
            columns: this.withCurrencyTitles(TIMESHEET_COLUMNS, currency),
            data: res.data.map((item: Timesheet) => ({
              ...item,
              id: item.id ?? item.crewId,
              startDate: item.venueName?.toUpperCase() === 'TOTAL' ? '' : item.startDate,
              companyName: item.venueName?.toUpperCase() === 'TOTAL' ? '' : item.companyName,
            }))
          }));
        }
      })
  }

  sendToEmail(crewDetail: CrewDetail) {
    this.emailLoading.set(true);
    const { crewId } = crewDetail;

    const params = {
      crewId,
      month: this.form?.get('month')?.value || this.getCalculatedMonth(),
      year: this.form?.get('year')?.value || this.today().getFullYear()
    }

    this.post<Timesheet[]>(`Crew/SendCrewTimeSheetsByMail`, params)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.emailLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('Email has been sent');
        }
      })
  }
}
