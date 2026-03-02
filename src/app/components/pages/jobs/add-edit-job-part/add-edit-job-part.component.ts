import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, input, OnInit, output, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GeneralService } from '../../../../shared/services/general.service';
import { ApiBase } from '../../../../shared/bases/api-base';
import {
  AddOrUpdateJobPartRequest,
  JobPartDetailsResponse,
  JobPartRateCard,
  JobPartTypeItem
} from '../../../../shared/interface/jobs';
import { CrewSkillListItem } from '../../../../shared/interface/crew';
import { CurrencyPipe } from '@angular/common';
import { ChipCountSelectComponent } from '../../../../shared/components/ui/chip-count-select';
import type { ChipCountItem, ChipCountOption } from '../../../../shared/components/ui/chip-count-select';

@Component({
  selector: 'app-add-edit-job-part',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbAccordionModule,
    CurrencyPipe,
    ChipCountSelectComponent
  ],
  templateUrl: './add-edit-job-part.component.html',
  styleUrl: './add-edit-job-part.component.scss'
})
export class AddEditJobPartComponent extends ApiBase implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _dr = inject(DestroyRef);

  jobId = input<number>();
  jobPartId = input<number>(0);
  jobRateCard = input<JobPartRateCard>();

  /** Emitted when user cancels or when modal should close without refetch */
  finish = output<void>();
  /** Emitted after job part is saved successfully (parent should close modal and refetch) */
  saved = output<void>();

  submitLoading = signal(false);

  activeNotesTab: WritableSignal<number> = signal(1);

  jobPartTypes: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  skillListOptions: WritableSignal<ChipCountOption[]> = signal<ChipCountOption[]>([]);

  jobPartTypesLoading = signal(false);
  skillsLoading = signal(false);
  partDetailsLoading = signal(false);

  /** Rate for ccSupplement calculation (from job part rateCard or default). */
  crewChiefSupplementRate = signal(5);
  /** Rate for fuelCost calculation: fuelCost = returnMileage * mileageRate (from rateCard.milage). */
  mileageRate = signal(0.65);
  skillSupplement = signal(0);
  crewRate = signal(0);
  extraHour = signal(0);

  constructor(http: HttpClient) {
    super(http);
    effect(() => {
      const id = this.jobPartId();
      if (id != null && id > 0) {
        this.loadJobPartDetails(id);
      }
    });

    effect(() => {
      const rc = this.jobRateCard();
      if (rc) {
        this.crewChiefSupplementRate.set(rc.crewChiefSupplement);
        this.mileageRate.set(rc.milage);
        this.skillSupplement.set(rc.skillSupplement);
        this.crewRate.set(rc.crewRate);
        this.extraHour.set(rc.extraHour);
      }
    })
  }

  loadJobPartTypes(): void {
    this.jobPartTypesLoading.set(true);
    this.get<JobPartTypeItem[]>('Jobs/GetJobPartType')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.jobPartTypesLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          const items = res.data ?? [];
          const options = items.map((item) => ({
            value: item.jobPartTypeId ?? item.id ?? 0,
            label: item.typeText ?? item.name ?? ''
          })).filter((opt) => opt.label !== '');
          this.jobPartTypes.set(options);
          const currentId = this.form.get('jobPartTypeId')?.value;
          const exists = options.some((opt) => opt.value === currentId);
          if (options.length && !exists) {
            this.form.patchValue({ jobPartTypeId: options[0].value });
          }
        }
      });
  }

  readonly hoursOptions = signal<Select2Option[]>(
    Array.from({ length: 25 }, (_, i) => {
      const hours = i + 1;
      return { value: hours, label: `${ hours } Hour${ hours !== 1 ? 's' : '' }` };
    })
  );

  readonly crewOptions = signal<Select2Option[]>(
    Array.from({ length: 21 }, (_, i) => {
      const crew = i + 1;
      return { value: crew, label: `${ crew } Crew` };
    })
  );

  readonly travelHoursOptions = signal(
    Array.from({ length: 13 }, (_, i) => ({ value: i, label: `${ i }hrs` }))
  );

  readonly extraCrewOptions = signal(
    Array.from({ length: 11 }, (_, i) => ({ value: i, label: `${ i } Extra Crew` }))
  );

  form: FormGroup = this._fb.group({
    jobPartTypeId: [ 1 ],
    startDate: [ null ],
    jobPartHours: [ 1 ],
    jobPartNumber: [ 0 ],
    crewNumber: [ 1 ],
    crewChiefNumber: [ 0 ],
    ccSupplement: [ null ],
    quoteCost: [ 0 ],
    eventId: [ '' ],

    // OOT - Out of town / travel costs
    travelHours: [ 0 ],
    travelHoursCost: [ 0 ],
    returnMileage: [ 0 ],
    ootCost: [ 0 ],
    lateShiftCost: [ 0 ],
    fuelCost: [ 0 ],
    fuelCostCrew: [ 0 ],

    // Extra hours
    extraCrew: [ 0 ],
    extraHours: [ 0 ],
    extraCost: [ 0 ],

    // Miscellaneous costs and skills
    misc: [ null ],
    miscCost: [ 0 ],
    fuel: [ 0 ],
    skillSupplement: [ 0 ],
    jobPartSkillsAddRequests: [ [] as ChipCountItem[] ],

    // Venue / Contact
    jobPartVenueName: [ null ],
    jobPartVenuePostcode: [ null ],
    onsiteContact: [ null ],
    alphaDrivers: [ 0 ],

    // Notes
    importantNotes: [ false ],
    notes: [ null ],
    crewNotes: [ null ],
    skillsNotes: [ null ],
    paperworkNotes: [ null ],

    // Flags
    lateChange: [ false ],
  });

  ngOnInit(): void {
    this.loadJobPartTypes();
    this.loadSkillList();
    this.syncSkillToSkillCoast();
    this.syncTravelHoursToCoast();
    this.syncFuelCostFromMileage();
    this.syncExtraHoursToExtraCoast();
    this.syncCcSupplementFromCrewAndHours();
  }

  loadSkillList(): void {
    this.skillsLoading.set(true);
    this.get<CrewSkillListItem[]>('Crew/GetSkillList')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.skillsLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          const items = res.data ?? [];
          const options: ChipCountOption[] = items.map((item) => ({
            id: item.crewSkillId,
            label: item.crewSkillText || item.crewSkillAbbr || String(item.crewSkillId)
          }));
          this.skillListOptions.set(options);
        }
      });
  }

  private _getNumber(path: string, fallback = 0): number {
    return Number(this.form.get(path)?.value ?? fallback);
  }

  get total(): number {
    const jobPartHours = this._getNumber('jobPartHours', 1);
    const crewNumber = this._getNumber('crewNumber', 1);
    const ccSupplement = this._getNumber('ccSupplement');

    const base =
      this.crewChiefSupplementRate() *
      jobPartHours *
      crewNumber;

    return (
      base +
      ccSupplement +
      this.ootTotal +
      this.skillsTotal +
      this.extraTotal
    );
  }

  get ootTotal(): number {
    return [
      'travelHoursCost',
      'ootCost',
      'lateShiftCost',
      'fuelCost'
    ].reduce((sum, key) => sum + this._getNumber(key), 0);
  }

  get skillsTotal(): number {
    return [
      'miscCost',
      'skillSupplement'
    ].reduce((sum, key) => sum + this._getNumber(key), 0);
  }

  get extraTotal(): number {
    return this._getNumber('extraCost');
  }

  /** When travel or crew number changes */
  private syncTravelHoursToCoast(): void {
    const updateTravelCosts = (): void => {
      const crewRate = this.crewRate();
      const travelHours = Number(this.form.get('travelHours')?.value ?? 0);
      const crewNumber = Number(this.form.get('crewNumber')?.value ?? 0);
      this.form.patchValue({
        travelHoursCost: crewRate * crewNumber * travelHours
      }, { emitEvent: false });
    };

    this.form.get('travelHours')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateTravelCosts());
    updateTravelCosts();

    this.form.get('crewNumber')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateTravelCosts());
  }

  /** When skills or hours changes */
  private syncSkillToSkillCoast(): void {
    const updateSkillCosts = (): void => {
      const skillSupplementRate = this.skillSupplement();
      const jobPartHours = Number(this.form.get('jobPartHours')?.value ?? 0);
      const items = (this.form.get('jobPartSkillsAddRequests')?.value as ChipCountItem[]) ?? [];
      const totalSkillCount = items.reduce((sum, item) => sum + item.count, 0);
      this.form.patchValue({
        skillSupplement: skillSupplementRate * jobPartHours * totalSkillCount
      }, { emitEvent: false });
    };

    this.form.get('jobPartSkillsAddRequests')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateSkillCosts());
    this.form.get('jobPartHours')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateSkillCosts());
    updateSkillCosts();
  }

  /** When extraHours changes */
  private syncExtraHoursToExtraCoast(): void {
    const updateExtraCosts = (): void => {
      const extraHours = this.extraHour();
      const extraHoursField = Number(this.form.get('extraHours')?.value ?? 0);
      this.form.patchValue({
        extraCost: extraHours * extraHoursField
      }, { emitEvent: false });
    };

    this.form.get('extraHours')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateExtraCosts());
    updateExtraCosts();
  }

  /** When returnMileage changes: fuelCost = returnMileage * mileageRate, fuelCostCrew = returnMileage * (mileageRate - 0.2). */
  private syncFuelCostFromMileage(): void {
    const updateFuelCosts = (): void => {
      const returnMileage = Number(this.form.get('returnMileage')?.value ?? 0);
      const rate = this.mileageRate();
      this.form.patchValue({
        fuelCost: returnMileage * rate,
        fuelCostCrew: returnMileage * rate * 0.8,
      }, { emitEvent: false });
    };

    this.form.get('returnMileage')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateFuelCosts());
    updateFuelCosts();
  }

  /** When crewNumber or jobPartHours changes, recalculate ccSupplement. */
  private syncCcSupplementFromCrewAndHours(): void {
    const updateCcSupplement = (): void => {
      const crewNumber = Number(this.form.get('crewNumber')?.value ?? 0);
      const jobPartHours = Number(this.form.get('jobPartHours')?.value ?? 0);
      const rate = this.crewChiefSupplementRate();
      let ccSupplement = 0;
      if (crewNumber > 12) {
        ccSupplement = jobPartHours * 2 * rate;
      } else if (crewNumber > 3 && crewNumber <= 12) {
        ccSupplement = jobPartHours * rate;
      }
      this.form.patchValue({ ccSupplement }, { emitEvent: false });
    };

    this.form.get('crewNumber')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateCcSupplement());

    this.form.get('jobPartHours')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(() => updateCcSupplement());

    updateCcSupplement();
  }

  /** GET Jobs/GetJobPart and patch form (edit mode). */
  private loadJobPartDetails(jobPartId: number): void {
    this.partDetailsLoading.set(true);
    this.get<JobPartDetailsResponse>('Jobs/GetJobPart', { jobPartId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.partDetailsLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          const part = res.data;
          if (part) {
            const rc = part.rateCard;
            if (rc?.crewChiefSupplement != null) this.crewChiefSupplementRate.set(rc.crewChiefSupplement);
            if (rc?.milage != null) this.mileageRate.set(rc.milage);
            if (rc?.skillSupplement != null) this.skillSupplement.set(rc.skillSupplement);
            if (rc?.crewRate != null) this.crewRate.set(rc.crewRate);
            if (rc?.extraHour != null) this.extraHour.set(rc.extraHour);
            this.patchFormWithPart(part);
          }
        },
      });
  }

  private patchFormWithPart(part: JobPartDetailsResponse): void {
    const startForInput = this.isoToDatetimeLocal(part.startDate);
    const jobPartHours = part.jobPartHours ?? this.computeHoursFromStartEnd(part.startDate, part.endDate);
    this.form.patchValue({
      jobPartTypeId: part.jobPartTypeId,
      startDate: startForInput,
      jobPartHours: jobPartHours ?? 0,
      jobPartNumber: part.jobPartNumber ?? 0,
      crewNumber: part.crewNumber,
      crewChiefNumber: part.crewChiefNumber,
      ccSupplement: part.ccSupplement,
      quoteCost: part.quoteCost,
      eventId: part.eventId ?? '',
      travelHours: part.travelHours,
      travelHoursCost: part.travelHoursCost,
      returnMileage: part.returnMileage,
      ootCost: part.ootCost,
      lateShiftCost: part.lateShiftCost,
      fuelCost: part.fuelCost,
      fuelCostCrew: part.fuelCostCrew,
      extraCrew: part.extraCrew,
      extraHours: part.extraHours,
      extraCost: part.extraCost,
      misc: part.misc ?? '',
      miscCost: part.miscCost,
      fuel: part.fuel ?? 0,
      skillSupplement: (part.jobPartSkills?.length ? part.skillSupplement : 0) ?? 0,
      jobPartVenueName: part.jobPartVenueName ?? '',
      jobPartVenuePostcode: part.jobPartVenuePostcode ?? '',
      onsiteContact: part.onsiteContact ?? '',
      alphaDrivers: part.alphaDrivers,
      importantNotes: part.importantNotes,
      notes: part.notes ?? '',
      crewNotes: part.crewNotes ?? '',
      skillsNotes: part.skillsNotes ?? '',
      paperworkNotes: part.paperworkNotes ?? '',
      lateChange: part.lateChange ?? false,
      jobPartSkillsAddRequests: (part.jobPartSkills ?? []).map((s) => ({ id: s.skillId, count: s.count })),
    }, { emitEvent: false });
  }

  private computeHoursFromStartEnd(startIso: string, endIso: string): number {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
  }

  /** ISO string to datetime-local value YYYY-MM-DDTHH:mm. */
  private isoToDatetimeLocal(iso: string): string {
    if (!iso?.trim()) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${ d.getFullYear() }-${ pad(d.getMonth() + 1) }-${ pad(d.getDate()) }T${ pad(d.getHours()) }:${ pad(d.getMinutes()) }`;
  }

  /** Builds start/end from "Start date and time" (datetime-local → YYYY-MM-DDTHH:mm). */
  private buildStartEndDates(): { startDate: string; endDate: string } {
    const startVal = this.form.get('startDate')?.value as string | null;
    const hours = Number(this.form.get('jobPartHours')?.value ?? 0);
    const raw = startVal?.trim() ?? '';
    const startDate = raw.length >= 16
      ? (raw.length === 16 ? `${ raw }:00` : raw.slice(0, 19))
      : this.getDefaultStartLocalIso();

    const [ datePart, timePart ] = startDate.split('T');
    const [ y, m, d ] = (datePart ?? '').split('-').map(Number);
    const [ h, min ] = (timePart ?? '00:00:00').split(':').map(Number);
    const startLocal = new Date(y, m - 1, d, h ?? 0, min ?? 0, 0, 0);
    const endLocal = new Date(startLocal.getTime() + hours * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const endDate =
      `${ endLocal.getFullYear() }-${ pad(endLocal.getMonth() + 1) }-${ pad(endLocal.getDate()) }T${ pad(endLocal.getHours()) }:${ pad(endLocal.getMinutes()) }:${ pad(endLocal.getSeconds()) }`;

    return { startDate, endDate };
  }

  private getDefaultStartLocalIso(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${ d.getFullYear() }-${ pad(d.getMonth() + 1) }-${ pad(d.getDate()) }T${ pad(d.getHours()) }:${ pad(d.getMinutes()) }:00`;
  }

  private buildPayload(): Partial<AddOrUpdateJobPartRequest> {
    const v = this.form.getRawValue();
    const { startDate, endDate } = this.buildStartEndDates();
    return {
      jobPartId: this.jobPartId() ?? 0,
      jobId: this.jobId() ?? 0,
      jobPartTypeId: Number(v.jobPartTypeId ?? 0),
      eventId: v.eventId ?? '',
      jobPartVenueName: v.jobPartVenueName ?? '',
      jobPartVenuePostcode: v.jobPartVenuePostcode ?? '',
      alphaDrivers: Number(v.alphaDrivers ?? 0),
      startDate,
      endDate,
      crewNumber: Number(v.crewNumber ?? 0),
      crewChiefNumber: Number(v.crewChiefNumber ?? 0),
      ccSupplement: Number(v.ccSupplement ?? 0),
      quoteCost: Number(v.quoteCost ?? 0),
      extraCrew: Number(v.extraCrew ?? 0),
      extraHours: Number(v.extraHours ?? 0),
      extraCost: Number(v.extraCost ?? 0),
      ootCost: Number(v.ootCost ?? 0),
      travelHours: Number(v.travelHours ?? 0),
      travelHoursCost: Number(v.travelHoursCost ?? 0),
      lateShiftCost: Number(v.lateShiftCost ?? 0),
      returnMileage: Number(v.returnMileage ?? 0),
      misc: v.misc ?? '',
      miscCost: Number(v.miscCost ?? 0),
      fuel: Number(v.fuel ?? 0),
      fuelCost: Number(v.fuelCost ?? 0),
      fuelCostCrew: Number(v.fuelCostCrew ?? 0),
      notes: v.notes ?? '',
      crewNotes: v.crewNotes ?? '',
      skillsNotes: v.skillsNotes ?? '',
      paperworkNotes: v.paperworkNotes ?? '',
      importantNotes: Boolean(v.importantNotes),
      lateChange: Boolean(v.lateChange),
      jobPartNumber: Number(v.jobPartNumber ?? 0),
      jobPartHours: Number(v.jobPartHours ?? 0),
      jobPartSkillsAddRequests: ((v.jobPartSkillsAddRequests as ChipCountItem[]) ?? []).map((item) => ({
        skillId: item.id,
        count: item.count
      })),
      skillSupplement: Number(v.skillSupplement ?? 0),
      onsiteContact: v.onsiteContact ?? ''
    };
  }

  submit(): void {
    if (this.form.invalid) {
      GeneralService.markFormGroupTouched(this.form);
      return;
    }
    const jobId = this.jobId();
    if (jobId == null || jobId <= 0) {
      GeneralService.showErrorMessage('Job is required to add a part.');
      return;
    }
    this.submitLoading.set(true);
    const payload = this.buildPayload();
    this.post<unknown, AddOrUpdateJobPartRequest>('Jobs/AddOrUpdateJobPart', payload as AddOrUpdateJobPartRequest)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.submitLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          GeneralService.showSuccessMessage('Job part saved successfully');
          this.saved.emit();
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to save job part');
        },
      });
  }
}
