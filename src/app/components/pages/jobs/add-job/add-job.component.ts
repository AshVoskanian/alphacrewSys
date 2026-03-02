import { Component, DestroyRef, inject, OnInit, output, signal, ViewChild, WritableSignal } from '@angular/core';
import { JobClient, JobDetails, JobVenue } from "../../../../shared/interface/jobs";
import { ApiBase } from "../../../../shared/bases/api-base";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { JOB_STATUSES, JOB_STATUSES_FOR_JPART } from "../jobs-filter/jobs-utils";
import { RegionsService } from "../../../../shared/services/regions.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged, filter, finalize, map, merge, Observable, Subject } from "rxjs";
import { GeneralService } from "../../../../shared/services/general.service";
import { NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-add-job',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbTypeahead
  ],
  templateUrl: './add-job.component.html',
  styleUrl: './add-job.component.scss'
})
export class AddJobComponent extends ApiBase implements OnInit {
  @ViewChild('instance', { static: true }) instance: NgbTypeahead;

  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private _regionsService = inject(RegionsService);

  finish = output<JobDetails>();

  loading = signal<boolean>(false);
  venueLoading = signal<boolean>(false);
  clientLoading = signal<boolean>(false);
  jobVenues: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  jobClients: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  regions = toSignal(this._regionsService.regions);
  statuses: WritableSignal<Select2Option[]> = signal<Select2Option[]>(JOB_STATUSES_FOR_JPART);

  form: FormGroup;

  public focus$ = new Subject<string>();
  public click$ = new Subject<string>();

  ngOnInit() {
    this.initForm();
    this.getJobClients();
  }

  initForm() {
    this.form = this._fb.group({
      statusId: [ 2, [ Validators.required ] ],
      jobRegionId: [ 1, [ Validators.required ] ],
      clientId: [ null, [ Validators.required ] ],
      venueId: [ null ],
      venue: [ null, [ Validators.required ] ],
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
          this.form.get('venue').setValue(null);
          this.getJobVenues(clientId, 0);
        }
      }
    })
  }

  subToVenueFilterChange() {
    this.form.get('showAllVenues').valueChanges.subscribe({
      next: all => {
        if (!all) {
          this.form.get('venueId').setValue(null);
        }
        this.getJobVenues(0, Number(all));
      }
    })
  }

  inputFormatter = (item: any) =>
    typeof item === 'string' ? item : item?.label;

  resultFormatter = (item: Select2Option) => item.label;

  onVenueSelect(event: any) {
    const selected: Select2Option = event.item;

    this.form.patchValue({
      venueId: selected.value,
      venue: selected.label
    });
  }


  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance?.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term => {
        const venues = this.jobVenues() as Select2Option[];

        if (!term) {
          return venues;
        }

        return venues.filter(v =>
          v.label.toLowerCase().includes(term.toLowerCase())
        );
      })
    );
  };


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

    const venue = this.form.get('venue').value?.label || this.form.get('venue').value;

    const isVenueFromList = this.jobVenues()?.find(v => {
      return v.label.trim().toLowerCase() === venue?.trim().toLowerCase()
    })

    const data = {
      clientId: this.form.get('clientId').value,
      venueId: isVenueFromList ? this.form.get('venueId').value : 0,
      venue,
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
