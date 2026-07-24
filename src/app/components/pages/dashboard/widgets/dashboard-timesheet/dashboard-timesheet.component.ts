import { Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Select2Data, Select2Module } from 'ng-select2-component';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { RegionsService } from '../../../../../shared/services/regions.service';

@Component({
  selector: 'app-dashboard-timesheet',
  imports: [CardComponent, ReactiveFormsModule, Select2Module],
  templateUrl: './dashboard-timesheet.component.html',
  styleUrl: './dashboard-timesheet.component.scss'
})
export class DashboardTimesheetComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _regionsService = inject(RegionsService);

  form!: FormGroup;

  regions = toSignal(this._regionsService.regions, { initialValue: [] });
  regionOptions = computed(() =>
    (this.regions() ?? []).filter(region => region.label !== 'All')
  );

  years: Select2Data = [];
  months: Select2Data = [
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
      regions: [[]],
      year: [now.getFullYear()],
      month: [defaultMonth]
    });
  }

  sendEmail() {
    // UI only — wire later
  }

  toggleLock() {
    // UI only — wire later
  }
}
