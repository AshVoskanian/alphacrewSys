import { Component, DestroyRef, effect, inject, input, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { JobClient, JobDetails, JobVenue } from "../../../../shared/interface/jobs";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { JOB_STATUSES } from "../jobs-filter/jobs-utils";
import { RegionsService } from "../../../../shared/services/regions.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged, filter, finalize, map, merge, Observable, Subject } from "rxjs";
import { GeneralService } from "../../../../shared/services/general.service";
import { ApiBase } from "../../../../shared/bases/api-base";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { NgbTooltip, NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-edit-job',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbTooltip,
    NgbTypeahead,
    DatePipe,
    CurrencyPipe
  ],
  providers: [ DatePipe ],
  templateUrl: './edit-job.component.html',
  styleUrl: './edit-job.component.scss'
})
export class EditJobComponent extends ApiBase implements OnInit {
  @ViewChild('venueInstance', { static: true }) venueInstance: NgbTypeahead;

  jobDetails = input<JobDetails>();

  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private readonly _regionsService = inject(RegionsService);
  private readonly _datePipe = inject(DatePipe);

  statuses: WritableSignal<Select2Option[]> = signal<Select2Option[]>(JOB_STATUSES);
  regions = toSignal(this._regionsService.regions);
  jobClients: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  jobVenues: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);

  loading = signal<boolean>(false);
  clientLoading = signal<boolean>(false);
  venueLoading = signal<boolean>(false);

  form: FormGroup;

  public focus$ = new Subject<string>();
  public click$ = new Subject<string>();

  constructor() {
    const http = inject(HttpClient);
    super(http);

    // Watch for jobDetails changes and update form
    effect(() => {
      const details = this.jobDetails();
      if (details && this.form) {
        this.setFormData();
      }
    });
  }

  ngOnInit() {
    this.initForm();
    this.getDropdownData();

    // Set initial form data if jobDetails is already available
    if (this.jobDetails()) {
      this.setFormData();
    }
  }

  initForm() {
    this.form = this._fb.group({
      statusId: [ 0, [ Validators.required ] ],
      jobRegionId: [ 0, [ Validators.required ] ],
      clientId: [ null, [ Validators.required ] ],
      venueId: [ null ],
      venue: [ null, [ Validators.required ] ],
      orderedBy: [ null ],
      jobContact: [ null ],
      importantDate: [ null ],
      invoiceDate: [ null ],
      paymentDueDate: [ null ],
      paidDate: [ null ],
      notes: [ null ],
      publish: [ false ],
      purchaseOrder: [ null, [ Validators.required ] ]
    });

    this.subToClientChange();
  }

  subToClientChange() {
    this.form.get('clientId')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: clientId => {
          if (clientId && clientId !== 0) {
            this.form.get('venueId')?.setValue(null);
            this.form.get('venue')?.setValue(null);
            this.getJobVenues(clientId);
          } else {
            this.jobVenues.set([]);
          }
        }
      });
  }

  getDropdownData() {
    this.getJobClients();
  }

  getJobClients() {
    this.clientLoading.set(true);

    this.get<JobClient[]>('Jobs/GetClientForJobDropDown')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.clientLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors && res.errors.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.jobClients.set(res.data.map(client => ({ label: client.companyName, value: client.clientId })));
        }
      });
  }

  getJobVenues(clientId?: number, setVenueAfterLoad = false) {
    this.venueLoading.set(true);

    this.post<JobVenue[]>('jobs/GetJobVenue', { id: clientId, all: 0 })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.venueLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors && res.errors.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const venues = res.data.map(venue => ({ label: venue.venueName, value: venue.venueId }));
          const details = this.jobDetails();

          // If we need to set venue after loading (from setFormData)
          if (setVenueAfterLoad && details?.venue) {
            // Check if venue exists in the list, if not add it
            const venueExists = venues.find(v =>
              v.label.trim().toLowerCase() === details.venue.trim().toLowerCase()
            );
            if (!venueExists && details.venueId) {
              // Add the venue to the list if it's not there
              venues.unshift({ label: details.venue, value: details.venueId });
            }
          }

          this.jobVenues.set(venues);
        }
      });
  }

  setFormData() {
    const details = this.jobDetails();
    if (!details) return;

    const formatDate = (dateStr: string | null | undefined): string | null => {
      if (!dateStr) return null;
      return this._datePipe.transform(dateStr, 'yyyy-MM-dd') || null;
    };

    this.form.patchValue({
      statusId: details.statusId,
      jobRegionId: details.jobRegionId,
      clientId: details.clientId,
      orderedBy: details.orderedBy,
      jobContact: details.jobContact,
      importantDate: formatDate(details.importantDate),
      invoiceDate: formatDate(details.invoiceDate),
      paymentDueDate: formatDate(details.paymentDueDate),
      paidDate: formatDate(details.paidDate),
      notes: details.notes,
      publish: details.publish,
      purchaseOrder: details.purchaseOrder
    }, { emitEvent: false });

    // Load venues only if clientId exists and is valid
    // Set venue after venues are loaded
    if (details.clientId && details.clientId !== 0) {
      this.getJobVenues(details.clientId, true);
    }

    // Set venue value for typeahead
    if (details.venue) {
      this.form.patchValue({
        venue: details.venue,
        venueId: details.venueId
      }, { emitEvent: false });
    }
  }

  inputFormatter = (item: any) =>
    typeof item === 'string' ? item : item?.label;

  resultFormatter = (item: Select2Option) => item.label;

  onVenueSelect(event: any) {
    const selected: Select2Option = event.item;

    this.form.patchValue({
      venueId: selected.value,
      venue: selected.label
    }, { emitEvent: false });
  }

  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.venueInstance?.isPopupOpen()));
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Handle file upload logic here if needed
      console.log('File selected:', file.name);
    }
  }

  submit() {
    if (this.loading() || !this.form.valid) return;

    this.loading.set(true);

    const formValue = this.form.value;

    // Convert date strings to ISO format
    const toISOString = (dateStr: string | null | undefined): string | null => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    // Get venue name - from typeahead input or from dropdown
    const venue = formValue.venue?.label || formValue.venue;
    const isVenueFromList = this.jobVenues()?.find(v => {
      return v.label.trim().toLowerCase() === venue?.trim().toLowerCase();
    });
    const venueName = venue || '';

    const data = {
      jobId: this.jobDetails()?.jobId,
      statusId: formValue.statusId,
      jobRegionId: formValue.jobRegionId,
      clientId: formValue.clientId,
      venueId: isVenueFromList ? formValue.venueId : 0,
      venue: venueName,
      orderedBy: formValue.orderedBy,
      jobContact: formValue.jobContact,
      importantDate: toISOString(formValue.importantDate),
      invoiceDate: toISOString(formValue.invoiceDate),
      paymentDueDate: toISOString(formValue.paymentDueDate),
      paidDate: toISOString(formValue.paidDate),
      notes: formValue.notes,
      publish: formValue.publish,
      purchaseOrder: formValue.purchaseOrder
    };

    this.post<JobDetails>('Jobs/AddOrUpdateJob', data)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors && res.errors.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('Job updated successfully');
        }
      });
  }
}
