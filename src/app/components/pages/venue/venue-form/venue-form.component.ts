import { Component, DestroyRef, inject, input, OnChanges, OnInit, output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { VenueDetails } from "../../../../shared/interface/venue";
import { ApiBase } from "../../../../shared/bases/api-base";
import { GeneralService } from "../../../../shared/services/general.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { RegionsService } from "../../../../shared/services/regions.service";

@Component({
  selector: 'app-venue-form',
  imports: [
    ReactiveFormsModule,
    Select2Module
  ],
  templateUrl: './venue-form.component.html',
  styleUrl: './venue-form.component.scss'
})
export class VenueFormComponent extends ApiBase implements OnInit, OnChanges {
  private _dr: DestroyRef = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private _regionsService = inject(RegionsService);

  venueDetails = input<VenueDetails>(null);

  finish = output<VenueDetails>();

  loading = signal<boolean>(false);
  regions = signal<Select2Option[]>([]);

  form: FormGroup;

  ngOnInit() {
    this.initForm();
    this.subToRegions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['venueDetails'] && changes['venueDetails'].currentValue) {
      this.setFormData(this.venueDetails());
    }
  }


  subToRegions() {
    this._regionsService.regions.pipe(
      takeUntilDestroyed(this._dr),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: regions => {
        this.regions.set(
          regions.filter(it => it.label !== 'All')
        );
      }
    })
  }

  initForm() {
    this.form = this._fb.group({
      venueName: [ '', Validators.required ],
      regionId: [ 1 ],
      onSiteContact: [ '' ],
      onSiteContact2: [ '' ],
      temporaryEntry: [ true ],
      address: [ '' ],
      postCode: [ '' ],
      notes: [ '' ],
      crewNotes: [ '' ],
      officeNotes: [ '' ],
      importantNotes: [ null ],
      oot: [ null ],
      drivingBonus: [ null ],
      riskAssessment: [ null ]
    })
  }

  setFormData(venueDetails: VenueDetails) {
    if (!venueDetails) return;

    this.form.patchValue({
      venueName: venueDetails.venueName,
      regionId: venueDetails.regionId,
      onSiteContact: venueDetails.onSiteContact,
      onSiteContact2: venueDetails.onSiteContact2,
      temporaryEntry: venueDetails.temporaryEntry,
      address: venueDetails.address,
      postCode: venueDetails.postCode,
      importantNotes: venueDetails.importantNotes,
      notes: venueDetails.notes,
      crewNotes: venueDetails.crewNotes,
      officeNotes: venueDetails.officeNotes,
      riskAssessment: venueDetails.riskAssessment,
      oot: venueDetails.oot,
      drivingBonus: venueDetails.drivingBonus,
    });

    this.form.updateValueAndValidity();
  }

  submit() {
    if (this.loading()) return;

    this.loading.set(true);

    const data: VenueDetails = {
      ...this.venueDetails(),
      ...this.form.getRawValue()
    }

    if (!this.venueDetails()) {
      delete data.venueId;
    }

    GeneralService.clearObject(data);

    if (this.form.valid) {
      this.post<VenueDetails>('Venues/AddOrUpdateVenue', data)
        .pipe(
          takeUntilDestroyed(this._dr),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (res) => {
            if (res.errors && res.errors.errorCode) {
              GeneralService.showErrorMessage(res.errors.message);
              return;
            }

            this.setFormData(res.data);
            this.finish.emit(res.data);
            GeneralService.showSuccessMessage();
          }
        })
    }
  }
}
