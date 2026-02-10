import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, input, OnInit, output, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GeneralService } from '../../../../shared/services/general.service';
import { ApiBase } from '../../../../shared/bases/api-base';
import { AddOrUpdateJobPartRequest, JobPartDetailsResponse, JobPartTypeItem } from '../../../../shared/interface/jobs';

@Component({
  selector: 'app-add-edit-job-part',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbAccordionModule
  ],
  templateUrl: './add-edit-job-part.component.html',
  styleUrl: './add-edit-job-part.component.scss'
})
export class AddEditJobPartComponent extends ApiBase implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _dr = inject(DestroyRef);

  jobId = input<number>();
  jobPartId = input<number>(0);

  /** Emitted when user cancels or when modal should close without refetch */
  finish = output<void>();
  /** Emitted after job part is saved successfully (parent should close modal and refetch) */
  saved = output<void>();

  submitLoading = signal(false);

  activeNotesTab: WritableSignal<number> = signal(1);

  jobPartTypes: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);

  jobPartTypesLoading = signal(false);
  partDetailsLoading = signal(false);

  constructor(http: HttpClient) {
    super(http);
    effect(() => {
      const id = this.jobPartId();
      if (id != null && id > 0) {
        this.loadJobPartDetails(id);
      }
    });
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

  /** Dropdown value -> form control name for required skill. */
  private static readonly REQUIRED_SKILL_TO_CONTROL: Record<string, string> = {
    driver: 'skillDriver',
    forklift: 'skillForklift',
    ipaf: 'skillIpaf',
    safety: 'skillSafety',
    construction: 'skillConstruction',
    carpenter: 'skillCarpenter',
    lightning: 'skillLightning',
    sound: 'skillSound',
    video: 'skillVideo',
    firstaid: 'skillFirstAid',
  };

  readonly skillsOptions = signal<{ value: string; label: string }[]>([
    { value: 'driver', label: 'Driver' },
    { value: 'forklift', label: 'Forklift' },
    { value: 'ipaf', label: 'IPAF' },
    { value: 'safety', label: 'Safety' },
    { value: 'construction', label: 'Construction' },
    { value: 'carpenter', label: 'Carpenter' },
    { value: 'lightning', label: 'Lightning' },
    { value: 'sound', label: 'Sound' },
    { value: 'video', label: 'Video' },
    { value: 'firstaid', label: 'First Aid' },
  ]);

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
    requiredSkills: [ null as string | null ],

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

    // Skills
    skillDriver: [ false ],
    skillForklift: [ false ],
    skillIpaf: [ false ],
    skillIpaf3b: [ false ],
    skillSafety: [ false ],
    skillConstruction: [ false ],
    skillCarpenter: [ false ],
    skillLightning: [ false ],
    skillSound: [ false ],
    skillVideo: [ false ],
    skillTfm: [ false ],
    skillTelehandler: [ false ],
    skillScissorlift: [ false ],
    skillCherrypicker: [ false ],
    skillFirstAid: [ false ],
    skillPasma: [ false ],
    skillFollowspot: [ false ],
    skillAudioTech: [ false ],
    skillRoughTerrainForklift: [ false ],
    skillHealhAndSafety: [ false ],
    skillWorkingAtHeight: [ false ],
  });

  ngOnInit(): void {
    this.loadJobPartTypes();
    this.syncRequiredSkillToForm();
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
          if (part) this.patchFormWithPart(part);
        },
      });
  }

  private patchFormWithPart(part: JobPartDetailsResponse): void {
    const startForInput = this.isoToDatetimeLocal(part.startDate);
    const jobPartHours = part.jobPartHours ?? this.computeHoursFromStartEnd(part.startDate, part.endDate);
    const bool = (v: boolean | null | undefined) => v === true;
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
      skillSupplement: part.skillSupplement,
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
      skillDriver: bool(part.skillDriver),
      skillForklift: bool(part.skillForklift),
      skillIpaf: bool(part.skillIpaf),
      skillIpaf3b: bool(part.skillIpaf3b),
      skillSafety: bool(part.skillSafety),
      skillConstruction: bool(part.skillConstruction),
      skillCarpenter: bool(part.skillCarpenter),
      skillLightning: bool(part.skillLightning),
      skillSound: bool(part.skillSound),
      skillVideo: bool(part.skillVideo),
      skillTfm: bool(part.skillTfm),
      skillTelehandler: bool(part.skillTelehandler),
      skillScissorlift: bool(part.skillScissorlift),
      skillCherrypicker: bool(part.skillCherrypicker),
      skillFirstAid: bool(part.skillFirstAid),
      skillPasma: bool(part.skillPasma),
      skillFollowspot: bool(part.skillFollowspot),
      skillAudioTech: bool(part.skillAudioTech),
      skillRoughTerrainForklift: bool(part.skillRoughTerrainForklift),
      skillHealhAndSafety: bool(part.skillHealhAndSafety),
      skillWorkingAtHeight: bool(part.skillWorkingAtHeight),
    }, { emitEvent: false });
    this.setRequiredSkillsFromPart(part);
  }

  private computeHoursFromStartEnd(startIso: string, endIso: string): number {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
  }

  private setRequiredSkillsFromPart(part: JobPartDetailsResponse): void {
    const entry = Object.entries(AddEditJobPartComponent.REQUIRED_SKILL_TO_CONTROL)
      .find(([, ctrl]) => (part as unknown as Record<string, unknown>)[ctrl] === true);
    if (entry) this.form.patchValue({ requiredSkills: entry[0] }, { emitEvent: false });
  }

  /** ISO string to datetime-local value YYYY-MM-DDTHH:mm. */
  private isoToDatetimeLocal(iso: string): string {
    if (!iso?.trim()) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${ d.getFullYear() }-${ pad(d.getMonth() + 1) }-${ pad(d.getDate()) }T${ pad(d.getHours()) }:${ pad(d.getMinutes()) }`;
  }

  /** When "Required skills" dropdown changes, set the corresponding skill control to true. */
  private syncRequiredSkillToForm(): void {
    this.form.get('requiredSkills')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe((value: string | null) => {
        const controlName = value ? AddEditJobPartComponent.REQUIRED_SKILL_TO_CONTROL[value] : null;
        const updates: Record<string, boolean> = {};
        Object.values(AddEditJobPartComponent.REQUIRED_SKILL_TO_CONTROL).forEach((ctrl) => {
          updates[ctrl] = ctrl === controlName;
        });
        this.form.patchValue(updates, { emitEvent: false });
      });
  }

  /** Builds start/end from "Start date and time" (datetime-local → YYYY-MM-DDTHH:mm). */
  private buildStartEndDates(): { startDate: string; endDate: string } {
    const startVal = this.form.get('startDate')?.value as string | null;
    const hours = Number(this.form.get('jobPartHours')?.value ?? 0);
    const raw = startVal?.trim() ?? '';
    const startDate = raw.length >= 16
      ? (raw.length === 16 ? `${ raw }:00` : raw.slice(0, 19))
      : this.getDefaultStartLocalIso();

    const [datePart, timePart] = startDate.split('T');
    const [y, m, d] = (datePart ?? '').split('-').map(Number);
    const [h, min] = (timePart ?? '00:00:00').split(':').map(Number);
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

  private getSkillPayloadFromForm(v: Record<string, unknown>): Record<string, boolean> {
    const requiredControl = v['requiredSkills'] ? AddEditJobPartComponent.REQUIRED_SKILL_TO_CONTROL[v['requiredSkills'] as string] : null;
    const skillKeys = [
      'skillDriver', 'skillForklift', 'skillIpaf', 'skillIpaf3b', 'skillSafety', 'skillConstruction',
      'skillCarpenter', 'skillLightning', 'skillSound', 'skillVideo', 'skillTfm', 'skillTelehandler',
      'skillScissorlift', 'skillCherrypicker', 'skillFirstAid', 'skillPasma', 'skillFollowspot',
      'skillAudioTech', 'skillRoughTerrainForklift', 'skillHealhAndSafety', 'skillWorkingAtHeight',
    ];
    const out: Record<string, boolean> = {};
    skillKeys.forEach((key) => {
      out[key] = key === requiredControl ? true : Boolean(v[key]);
    });
    return out;
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
      ...this.getSkillPayloadFromForm(v),
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
