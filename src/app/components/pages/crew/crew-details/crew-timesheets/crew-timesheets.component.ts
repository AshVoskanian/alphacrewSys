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
import { TableConfigs } from "../../../../../shared/interface/common";
import { CrewDetail, Timesheet } from "../../../../../shared/interface/crew";
import { TableComponent } from "../../../../../shared/components/ui/table/table.component";
import { Select2Module, Select2Option } from "ng-select2-component";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { GeneralService } from "../../../../../shared/services/general.service";
import { MONTHS, YEARS } from "../../../../../shared/utils/date";
import { FormBuilder, FormGroup, FormsModule, Validators } from "@angular/forms";

@Component({
  selector: 'app-crew-timesheets',
  imports: [ TableComponent, Select2Module, FormsModule ],
  templateUrl: './crew-timesheets.component.html',
  styleUrl: './crew-timesheets.component.scss'
})
export class CrewTimesheetsComponent extends ApiBase implements OnChanges, OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _fb: FormBuilder = inject(FormBuilder);

  crewDetail = input<CrewDetail>();

  today = signal(new Date());
  loading = signal<boolean>(false);
  years = signal<Select2Option[]>(YEARS);
  months = signal<Select2Option[]>(MONTHS);

  tableConfig: WritableSignal<TableConfigs> = signal(
    {
      columns: [
        { title: 'Start', field_value: 'startDate', sort: true, type: 'date' },
        { title: 'Company', field_value: 'companyName', sort: true },
        { title: 'Venue', field_value: 'venueName', sort: true },
        { title: 'Hours', field_value: 'hours', sort: true },
        { title: 'Travel (£)', field_value: 'travelHours', sort: true },
        { title: 'Expenses (£)', field_value: 'ootCost', sort: true },
        { title: 'Skill (£)', field_value: 'skilledCost', sort: true },
        { title: 'Work Pay (£)', field_value: 'pay', sort: true },
        { title: 'Bonus (£)', field_value: 'bonus', sort: true },
        { title: 'Total Pay (£)', field_value: 'totalPay', sort: true },
      ],
      data: [] as Timesheet[]
    }
  )

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

          this.tableConfig().data = res.data.map((item: Timesheet) => ({
            ...item,
            id: item.crewId,
            startDate: item.venueName?.toUpperCase() === 'TOTAL' ? '' : item.startDate,
            companyName: item.venueName?.toUpperCase() === 'TOTAL' ? '' : item.companyName,
          }));
        }
      })
  }
}
