import { DatePipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select2Data, Select2Module } from 'ng-select2-component';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { ApiBase } from '../../../../../../shared/bases/api-base';
import { STRIKE_SEVERITIES } from '../../../../../../shared/data/dashboard/warnings';
import {
  DashboardCrewInfo,
  DashboardJobInfo,
  DashboardWarning,
  StrikeModel
} from '../../../../../../shared/interface/dashboard';
import { GeneralService } from '../../../../../../shared/services/general.service';

@Component({
  selector: 'app-warning-add-update',
  imports: [ReactiveFormsModule, Select2Module, DatePipe],
  templateUrl: './warning-add-update.component.html',
  styleUrl: './warning-add-update.component.scss'
})
export class WarningAddUpdateComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);

  @Input() loading = false;
  @Input() selectedWarning: DashboardWarning | null = null;

  @Output() closeModal = new EventEmitter<StrikeModel | null>();

  form!: FormGroup;

  severities: Select2Data = STRIKE_SEVERITIES;
  crews = signal<Select2Data>([]);
  shifts = signal<Select2Data>([]);

  crewsLoading = signal(false);
  shiftsLoading = signal(false);

  get isEditMode(): boolean {
    return !!this.selectedWarning?.strikeId;
  }

  ngOnInit() {
    this.initForm();
    this.loadCrews();
    this.watchJobId();

    const existingJobId = String(this.selectedWarning?.jobId ?? '').trim();
    if (existingJobId.length >= 5) {
      this.loadShifts(+existingJobId, this.selectedWarning?.jobPartId);
    }
  }

  initForm() {
    const strikeDate = this.selectedWarning?.strikeDate?.split('T')[0] ?? '';

    this.form = this._fb.group({
      crewId: [this.selectedWarning?.crewId ?? null, Validators.required],
      strikeDate: [strikeDate, Validators.required],
      warningType: [this.selectedWarning?.warningType ?? null, Validators.required],
      jobId: [this.selectedWarning?.jobId ?? '', Validators.required],
      jobPartId: [this.selectedWarning?.jobPartId ?? null],
      strikeReason: [this.selectedWarning?.strikeReason ?? '', Validators.required]
    });
  }

  loadCrews() {
    this.crewsLoading.set(true);

    this.get<DashboardCrewInfo[]>('Dashboard/GetDashboardCrewInfo')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.crewsLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.crews.set(
            (res.data ?? []).map(crew => ({
              label: crew.name,
              value: crew.crewId
            }))
          );
        }
      });
  }

  watchJobId() {
    this.form.get('jobId')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this._dr)
      )
      .subscribe(jobId => {
        const id = String(jobId ?? '').trim();

        if (id.length >= 5 && !Number.isNaN(+id)) {
          this.loadShifts(+id);
          return;
        }

        this.shifts.set([]);
        this.form.get('jobPartId')?.setValue(null, { emitEvent: false });
      });
  }

  loadShifts(jobId: number, preserveJobPartId?: number) {
    this.shiftsLoading.set(true);

    this.post<DashboardJobInfo[]>(`Dashboard/GetDashboardJobInfo?jobId=${jobId}`, null)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.shiftsLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            this.shifts.set([]);
            return;
          }

          const options = (res.data ?? []).map(shift => ({
            label: this.formatShiftLabel(shift),
            value: shift.jobPartId
          }));

          this.shifts.set(options);

          const jobPartId = preserveJobPartId ?? this.form.get('jobPartId')?.value;
          const stillExists = options.some(option => option.value === jobPartId);

          this.form.get('jobPartId')?.setValue(stillExists ? jobPartId : null, { emitEvent: false });
        }
      });
  }

  formatShiftLabel(shift: DashboardJobInfo): string {
    const [year, month, day] = (shift.startDate ?? '').split('-');
    const dateLabel = day && month && year ? `${day}/${month}/${year}` : shift.startDate;
    const timeLabel = (shift.startTime ?? '').slice(0, 5);

    return `${dateLabel}, ${timeLabel}, Crew: ${shift.crew}, Hours: ${shift.hours} :: ${shift.address}`;
  }

  save() {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const { crewId, strikeDate, warningType, jobId, jobPartId, strikeReason } = this.form.getRawValue();

    const payload: StrikeModel = {
      strikeId: this.selectedWarning?.strikeId ?? 0,
      crewId: +crewId,
      warningType: +warningType,
      jobId: jobId ? +jobId : null,
      jobPartId: jobPartId ? +jobPartId : null,
      strikeReason: (strikeReason ?? '').trim(),
      strikeDate: new Date(strikeDate).toISOString()
    };

    if (this.isEditMode && this.selectedWarning) {
      payload.createBy = this.selectedWarning.createBy;
      payload.createDate = this.selectedWarning.createDate;
      payload.modifiedBy = this.selectedWarning.modifiedBy;
      payload.modifiedDate = this.selectedWarning.modifiedDate;
    }

    this.closeModal.emit(payload);
  }
}
