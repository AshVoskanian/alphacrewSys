import { Component, DestroyRef, inject, OnInit, output, signal, WritableSignal } from '@angular/core';
import { JobClient, JobDetails, JobVenue } from "../../../../shared/interface/jobs";
import { ApiBase } from "../../../../shared/bases/api-base";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Data, Select2Module } from "ng-select2-component";
import { JOB_STATUSES } from "../jobs-filter/jobs-utils";
import { RegionsService } from "../../../../shared/services/regions.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { GeneralService } from "../../../../shared/services/general.service";

@Component({
  selector: 'app-add-job',
  imports: [
    ReactiveFormsModule,
    Select2Module
  ],
  templateUrl: './add-job.component.html',
  styleUrl: './add-job.component.scss'
})
export class AddJobComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private _regionsService = inject(RegionsService);

  finish = output<JobDetails>();

  loading = signal<boolean>(false);
  venueLoading = signal<boolean>(false);
  clientLoading = signal<boolean>(false);
  jobVenues: WritableSignal<Select2Data> = signal<Select2Data>([]);
  jobClients: WritableSignal<Select2Data> = signal<Select2Data>([]);
  regions = toSignal(this._regionsService.regions);
  statuses: WritableSignal<Select2Data> = signal<Select2Data>(JOB_STATUSES);

  form: FormGroup;

  ngOnInit() {
    this.initForm();
    this.getJobClients();
  }

  initForm() {
    this.form = this._fb.group({
      statusId: [ 0, [ Validators.required ] ],
      jobRegionId: [ 0, [ Validators.required ] ],
      clientId: [ null, [ Validators.required ] ],
      venueId: [ null, [ Validators.required ] ],
      showAllVenues: [ false, [ Validators.required ] ],
    });

    this.subToClientChange();
    this.subToVenueFilterChange();
  }

  subToClientChange() {
    this.form.get('clientId').valueChanges.subscribe({
      next: clientId => {
        if (this.form.get('showAllVenues').value) return;

        if (clientId || clientId === 0) {
          this.form.get('venueId').setValue(null);
          this.getJobVenues(clientId, 0);
        }
      }
    })
  }

  subToVenueFilterChange() {
    this.form.get('showAllVenues').valueChanges.subscribe({
      next: all => {
        const clientId = this.form.get('clientId').value;
        if (!all) {
          this.form.get('venueId').setValue(null);
        }
        this.getJobVenues(clientId, Number(all));
      }
    })
  }

  getJobVenues(clientId?: number, all = 1) {
    this.venueLoading.set(true);

    this.post<JobVenue[]>('jobs/GetJobVenue', { id: clientId, all })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.venueLoading.set(false))
      ).subscribe({
      next: res => {
        if (res.errors && res.errors.errorCode) {
          GeneralService.showErrorMessage(res.errors.message);
          return;
        }

        this.jobVenues.set(res.data.map(venue => ({ label: venue.venueName, value: venue.venueId })));
      }
    })
  }

  getJobClients() {
    this.clientLoading.set(true);

    this.get<JobClient[]>('Jobs/GetClientForJobDropDown')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.clientLoading.set(false))
      ).subscribe({
      next: res => {
        if (res.errors && res.errors.errorCode) {
          GeneralService.showErrorMessage(res.errors.message);
          return;
        }

        this.jobClients.set(res.data.map(client => ({ label: client.companyName, value: client.clientId })));
      }
    })
  }

  submit() {
    if (this.loading()) return;

    this.loading.set(true);

    const data = {
      clientId: this.form.get('clientId').value,
      venueId: this.form.get('venueId').value,
      jobRegionId: this.form.get('jobRegionId').value,
      statusId: this.form.get('statusId').value
    }

    if (this.form.valid) {
      this.post<JobDetails>('Jobs/AddOrUpdateJob', { ...data }).pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      ).subscribe({
        next: res => {
          if (res.errors && res.errors.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.finish.emit(res.data)
        }
      })
    }
  }
}
