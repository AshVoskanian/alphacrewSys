import { Component, DestroyRef, inject, input, OnInit, output, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GeneralService } from "../../../../shared/services/general.service";
import { ApiBase } from "../../../../shared/bases/api-base";
import { JobPartTypeItem } from "../../../../shared/interface/jobs";

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

  finish = output<void>();

  activeNotesTab: WritableSignal<number> = signal(1);

  jobPartTypes: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);

  jobPartTypesLoading = signal(false);

  constructor() {
    super(inject(HttpClient));
  }

  ngOnInit(): void {
    this.loadJobPartTypes();
  }

  private loadJobPartTypes(): void {
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
    Array.from({ length: 25 }, (_, i) => ({
      value: i,
      label: `${ i } Hour${ i !== 1 ? 's' : '' }`
    }))
  );

  readonly crewOptions = signal<Select2Option[]>(
    Array.from({ length: 21 }, (_, i) => ({
      value: i,
      label: `${ i } Crew`
    }))
  );

  readonly travelHoursOptions = signal(
    Array.from({ length: 13 }, (_, i) => ({ value: i, label: `${ i }hrs` }))
  );

  readonly extraCrewOptions = signal(
    Array.from({ length: 11 }, (_, i) => ({ value: i, label: `${ i } Extra Crew` }))
  );

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
    time: [ null ],
    jobPartHours: [ 10 ],
    crewNumber: [ 6 ],
    crewChiefNumber: [ 0 ],
    ccSupplement: [ null ],

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

  submit() {
    if (this.form.invalid) {
      GeneralService.markFormGroupTouched(this.form);
      return;
    }

    // Post
  }
}
