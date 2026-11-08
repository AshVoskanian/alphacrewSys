import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  viewChild,
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
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

const PAY = 'table-column-muted';
const STICKY_END = 'table-column-sticky-end';
const DEFAULT_CURRENCY = '£';
const HEADER_TOP_DESKTOP = 90;
const HEADER_TOP_MOBILE = 136;

interface TimesheetRow extends Timesheet {
  bookedHoursInfoTitle?: string;
  extraHoursInfoTitle?: string;
  travelHoursInfoTitle?: string;
  adjustmentInfoTitle?: string;
}

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
  { title: 'Fuel\n(£)', field_value: 'fuel', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'OOT\n(£)', field_value: 'oot', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'Transport\n(£)', field_value: 'transport', sort: true, type: 'price', decimal_number: true, min_width: 80, header_class: PAY, class: PAY },
  { title: 'Sundries\n(£)', field_value: 'sundries', sort: true, type: 'price', decimal_number: true, min_width: 77, header_class: PAY, class: PAY },
  { title: 'Bonus\n(£)', field_value: 'bonus', sort: true, type: 'price', decimal_number: true, min_width: 56, header_class: PAY, class: PAY },
  { title: 'LNS\n(£)', field_value: 'lateNightShift', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'LMB\n(£)', field_value: 'lastMinutBonus', sort: true, type: 'price', decimal_number: true, min_width: 52, header_class: PAY, class: PAY },
  { title: 'DRIVING\n(£)', field_value: 'drivingBonus', sort: true, type: 'price', decimal_number: true, min_width: 64, header_class: PAY, class: PAY },
  { title: 'ADJ\n(£)', field_value: 'adjustment', sort: true, type: 'template', min_width: 52, header_class: PAY, class: PAY },
  {
    title: 'TOTAL\n(£)',
    field_value: 'pay',
    sort: true,
    type: 'price',
    decimal_number: true,
    min_width: 58,
    header_class: `${PAY} ${STICKY_END}`,
    class: `${PAY} ${STICKY_END}`
  },
];

const TIMESHEET_TABLE_MIN_WIDTH = TIMESHEET_COLUMNS.reduce((sum, col) => sum + (col.min_width ?? 0), 0);

const withCurrencyTitles = (columns: TableColumn[], currency: string): TableColumn[] =>
  columns.map(col => ({
    ...col,
    title: col.title?.replace('(£)', `(${currency})`) ?? col.title
  }));

const resolveCurrency = (items: Timesheet[]): string =>
  items.find(item => item.timesheetCurrency?.trim())?.timesheetCurrency?.trim() || DEFAULT_CURRENCY;

const formatRateTitle = (currency: string, ...values: (number | null | undefined)[]): string | undefined => {
  if (values.some(value => value === null || value === undefined)) {
    return undefined;
  }

  const sum = values.reduce((total, value) => total + Number(value), 0);
  if (sum <= 0) {
    return undefined;
  }

  return `${currency}${sum.toFixed(2)}`;
};

const formatSingleRateTitle = (currency: string, value: number | null | undefined): string | undefined => {
  if (value === null || value === undefined || Number(value) <= 0) {
    return undefined;
  }

  return `${currency}${Number(value).toFixed(2)}`;
};

const mapTimesheetRow = (item: Timesheet, currency: string): TimesheetRow => {
  const isTotal = item.venueName?.toUpperCase() === 'TOTAL';
  const rowCurrency = item.timesheetCurrency?.trim() || currency;

  return {
    ...item,
    id: item.id ?? item.crewId,
    timesheetCurrency: rowCurrency,
    startDate: isTotal ? '' : item.startDate,
    companyName: isTotal ? '' : item.companyName,
    bookedHoursInfoTitle: isTotal ? undefined : formatRateTitle(rowCurrency, item.crewPayrate, item.loyaltyBonus),
    extraHoursInfoTitle: isTotal ? undefined : formatRateTitle(rowCurrency, item.extraHourRate, item.loyaltyBonus),
    travelHoursInfoTitle: isTotal ? undefined : formatSingleRateTitle(rowCurrency, item.travelHourRate),
    adjustmentInfoTitle: isTotal ? undefined : item.adjustmentTxt?.trim() || undefined,
  };
};

@Component({
  selector: 'app-crew-timesheets',
  imports: [ TableComponent, Select2Module, FormsModule, ReactiveFormsModule, NgbTooltipModule, CommonModule ],
  templateUrl: './crew-timesheets.component.html',
  styleUrl: './crew-timesheets.component.scss'
})
export class CrewTimesheetsComponent extends ApiBase implements OnChanges, OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _fb: FormBuilder = inject(FormBuilder);
  private tableWrapper = viewChild<ElementRef<HTMLElement>>('tableWrapper');
  private fixedHeader = viewChild<ElementRef<HTMLElement>>('fixedHeader');
  private syncingScroll = false;

  crewDetail = input<CrewDetail>();

  today = signal(new Date());
  loading = signal<boolean>(false);
  emailLoading = signal<boolean>(false);
  years = signal<Select2Option[]>(YEARS);
  months = signal<Select2Option[]>(MONTHS);
  timesheetTableMinWidth = TIMESHEET_TABLE_MIN_WIDTH;
  currency = signal(DEFAULT_CURRENCY);

  isHeaderStuck = signal(false);
  headerTop = signal(HEADER_TOP_DESKTOP);
  headerLeft = signal(0);
  headerWidth = signal(0);
  columnWidths = signal<number[]>([]);

  tableConfig: WritableSignal<TableConfigs> = signal(
    {
      columns: TIMESHEET_COLUMNS,
      data: [] as TimesheetRow[]
    }
  );

  form: FormGroup;

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

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.updateStickyHeader();
  }

  onTableHScroll(event: Event): void {
    this.syncHorizontalScroll((event.target as HTMLElement).scrollLeft, 'wrapper');
  }

  onFixedHeaderScroll(event: Event): void {
    this.syncHorizontalScroll((event.target as HTMLElement).scrollLeft, 'fixed');
  }

  private syncHorizontalScroll(scrollLeft: number, source: 'wrapper' | 'fixed'): void {
    if (this.syncingScroll) {
      return;
    }

    this.syncingScroll = true;
    if (source === 'wrapper') {
      const fixed = this.fixedHeader()?.nativeElement;
      if (fixed) {
        fixed.scrollLeft = scrollLeft;
      }
    } else {
      const wrapper = this.tableWrapper()?.nativeElement;
      if (wrapper) {
        wrapper.scrollLeft = scrollLeft;
      }
    }
    this.syncingScroll = false;
  }

  private updateStickyHeader(): void {
    const wrapper = this.tableWrapper()?.nativeElement;
    if (!wrapper) {
      this.isHeaderStuck.set(false);
      return;
    }

    const table = wrapper.querySelector('table');
    const thead = table?.querySelector('thead');
    if (!table || !thead) {
      this.isHeaderStuck.set(false);
      return;
    }

    const top = window.innerWidth <= 999 ? HEADER_TOP_MOBILE : HEADER_TOP_DESKTOP;
    const tableRect = table.getBoundingClientRect();
    const theadRect = thead.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const stuck =
      tableRect.top < top &&
      tableRect.bottom > top + theadRect.height;

    this.headerTop.set(top);
    this.headerLeft.set(wrapperRect.left);
    this.headerWidth.set(wrapperRect.width);
    this.columnWidths.set(
      Array.from(thead.querySelectorAll('th')).map(th => th.getBoundingClientRect().width)
    );
    this.isHeaderStuck.set(stuck);

    queueMicrotask(() => {
      const fixed = this.fixedHeader()?.nativeElement;
      if (fixed) {
        fixed.scrollLeft = wrapper.scrollLeft;
      }
    });
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

          const currency = resolveCurrency(res.data);
          this.currency.set(currency);

          this.tableConfig.update(config => ({
            ...config,
            columns: withCurrencyTitles(TIMESHEET_COLUMNS, currency),
            data: res.data.map(item => mapTimesheetRow(item, currency))
          }));

          queueMicrotask(() => this.updateStickyHeader());
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
