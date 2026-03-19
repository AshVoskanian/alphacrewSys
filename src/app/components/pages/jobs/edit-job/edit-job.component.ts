import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  TemplateRef,
  ViewChild,
  WritableSignal
} from '@angular/core';
import {
  AddPaymentResponse,
  Currency,
  JobClient,
  JobDetails,
  JobDocument,
  JobPart,
  JobPartRateCard,
  JobPartResponse,
  JobScheduleWarning,
  JobVenue,
  PartialPayment
} from "../../../../shared/interface/jobs";
import { AddPaymentComponent } from "../add-payment/add-payment.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { JOB_STATUSES } from "../jobs-filter/jobs-utils";
import { RegionsService } from "../../../../shared/services/regions.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged, filter, finalize, map, merge, Observable, Subject } from "rxjs";
import { GeneralService } from "../../../../shared/services/general.service";
import Swal from 'sweetalert2';
import { RateCard } from "../../../../shared/interface/clients";
import { ApiBase } from "../../../../shared/bases/api-base";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { NgbModal, NgbModalRef, NgbTooltip, NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { TableComponent } from "../../../../shared/components/ui/table/table.component";
import { TableClickedAction, TableConfigs } from "../../../../shared/interface/common";
import { TagInputModule } from "ngx-chips";
import { AddEditJobPartComponent } from "../add-edit-job-part/add-edit-job-part.component";

@Component({
  selector: 'app-edit-job',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbTooltip,
    NgbTypeahead,
    CurrencyPipe,
    TableComponent,
    AddPaymentComponent,
    TagInputModule,
    AddEditJobPartComponent
  ],
  providers: [ DatePipe ],
  templateUrl: './edit-job.component.html',
  styleUrl: './edit-job.component.scss'
})
export class EditJobComponent extends ApiBase implements OnInit {
  @ViewChild('venueInstance', { static: true }) venueInstance: NgbTypeahead;
  @ViewChild('addJobPartModal') addJobPartModalRef: TemplateRef<NgbModal>;

  jobDetails = input<JobDetails>();
  jobWarnings = input<JobScheduleWarning[]>();
  jobRateCard = input<JobPartRateCard>();

  partialPaymentsUpdated = output<AddPaymentResponse>();
  jobPartsUpdated = output<void>();

  /** Start date (ISO) of the job part that starts last; used as base for new part default (last + 24h). */
  lastJobPartStartDate = computed(() => {
    const parts = this.jobDetails()?.jobParts ?? [];
    if (!parts.length) return null;
    const latest = parts.reduce((best, p) =>
      new Date(p.startDate).getTime() > new Date(best.startDate).getTime() ? p : best
    );
    return latest.startDate;
  });

  editingJobPartId: WritableSignal<number | null> = signal<number | null>(null);

  financeSectionExpanded: WritableSignal<boolean> = signal(false);

  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private readonly _regionsService = inject(RegionsService);
  private readonly _datePipe = inject(DatePipe);
  private readonly _modal = inject(NgbModal);
  private readonly _generalService = inject(GeneralService);

  private modalRef: NgbModalRef;

  /** Initial values when form was loaded from jobDetails (for tooltip old vs new). */
  private _initialCurrencyId: number | null = null;
  private _initialJobRateCardId: number | null = null;
  private _initialCurrencyLabel: string = '—';
  private _initialRateCardLabel: string = '—';

  statuses: WritableSignal<Select2Option[]> = signal<Select2Option[]>(JOB_STATUSES);
  regions = toSignal(this._regionsService.regions);
  regionNames = computed(() => {
    return this.regions()
      .filter(reg => reg.label !== 'All')
      .map(reg => {
        return {
          display: reg.label,
          value: reg.value
        }
      })
  })
  jobClients: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  jobVenues: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  rateCards: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  currencies: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);

  loading = signal<boolean>(false);
  clientLoading = signal<boolean>(false);
  venueLoading = signal<boolean>(false);
  rateCardLoading = signal<boolean>(false);
  uploadLoading = signal<boolean>(false);
  documents = signal<JobDocument[]>([]);
  deletingDocument = signal<string | null>(null);
  downloadingDocument = signal<string | null>(null);
  deletingPartialPayment = signal<number | null>(null);

  form: FormGroup;

  jobPartsTableConfig: WritableSignal<TableConfigs> = signal<TableConfigs>({
    columns: [
      { title: '', field_value: 'warningIcon' },
      { title: '', field_value: 'typeIcon' },
      { title: 'Starts', field_value: 'starts' },
      { title: 'Time', field_value: 'time' },
      { title: 'Hours', field_value: 'hours' },
      { title: 'Crew', field_value: 'crewNumber' },
      { title: 'Travel', field_value: 'travelFormatted' },
      { title: 'Skills', field_value: 'skills' },
      { title: 'Ends', field_value: 'ends' },
      { title: 'Net', field_value: 'netFormatted' },
      { title: 'Gross', field_value: 'grossFormatted' }
    ],
    row_action: [
      {
        label: 'Delete',
        icon: 'fa-solid fa-trash txt-danger',
        class: 'square-white',
        action_to_perform: 'delete',
        modal: true,
        model_text: 'Are you sure you want to delete this job part?'
      },
      {
        label: 'Edit',
        icon: 'fa-solid fa-pen-to-square txt-primary',
        class: 'square-white',
        action_to_perform: 'edit'
      },
      { label: 'Copy', icon: 'fa-solid fa-copy txt-secondary', class: 'square-white', action_to_perform: 'copy' }
    ],
    data: []
  });

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
        this.updateJobPartsTable(details.jobParts);
        this.documents.set(details.documents || []);
      }
    });

    // Watch for warning changes and update parts
    effect(() => {
      const warnings = this.jobWarnings();
      if (warnings) {
        this.setPartWarnings(warnings);
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

  get prePaymentBadgeValue(): number {
    const v = this.form?.get('prePayment')?.value;
    return Number(v);
  }

  get discountBadgeValue(): number {
    const v = this.form?.get('discount')?.value;
    return Number(v);
  }

  get rateCardChanged(): boolean {
    const current = this.form?.get('jobRateCardId')?.value;
    return this._initialJobRateCardId !== current;
  }

  get currencyChanged(): boolean {
    const current = this.form?.get('currencyId')?.value;
    return this._initialCurrencyId !== current;
  }

  get currencyBadgeLabel(): string {
    const id = this.form?.get('currencyId')?.value;
    if (id == null) return '—';
    const c = this.currencies()?.find(x => x.value === id);
    return c?.label ?? '—';
  }

  get rateCardBadgeLabel(): string {
    const id = this.form?.get('jobRateCardId')?.value;
    if (id == null) return '—';
    const r = this.rateCards()?.find(x => x.value === id);
    return r?.label ?? '—';
  }

  get currencyBadgeTooltip(): string {
    const initialLabel = this.currencies()?.find(c => c.value === this._initialCurrencyId)?.label ?? this._initialCurrencyLabel ?? '—';
    if (this.currencyChanged) {
      return `Old: ${ initialLabel } → New: ${ this.currencyBadgeLabel }`;
    }
    return `Currency: ${ this.currencyBadgeLabel }`;
  }

  get prePaymentBadgeTooltip(): string {
    if (this.prePaymentBadgeValue > 0) {
      return 'Pre payment > 0';
    }
    return 'Pre payment: 0';
  }

  get discountBadgeTooltip(): string {
    if (this.discountBadgeValue > 0) {
      return 'Discount > 0';
    }
    return 'Discount: 0';
  }

  get rateCardBadgeTooltip(): string {
    const initialLabel = this.rateCards()?.find(r => r.value === this._initialJobRateCardId)?.label ?? this._initialRateCardLabel ?? '—';
    if (this.rateCardChanged) {
      return `Old: ${ initialLabel } → New: ${ this.rateCardBadgeLabel }`;
    }
    return `Rate card: ${ this.rateCardBadgeLabel }`;
  }

  toggleFinanceAccordion(): void {
    this.financeSectionExpanded.update(v => !v);
  }

  setPartWarnings(warnings: JobScheduleWarning[]): void {
    if (!warnings?.length) return;

    const parts = this.jobDetails()?.jobParts;
    if (!parts?.length) return;

    const warningMap = new Map(warnings.map(w => [ w.jobPartId, w ]));

    parts.forEach((part: JobPart) => {
      const match = warningMap.get(part.jobPartId);
      if (match) {
        part.warnings = match;
      }
    });

    this.updateJobPartsTable(this.jobDetails()?.jobParts)
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
      purchaseOrder: [ null ],
      jobRateCardId: [ null ],
      currencyId: [ null ],
      vat: [ true ],
      prePayment: [ 0 ],
      discount: [ 0 ],
      jobRegionAccess: [ [] as number[] ],
    });

    this.subToClientChange();
    this.subToJobRegionAccessChange();
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

  subToJobRegionAccessChange() {
    this.form.get('jobRegionAccess')?.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: raw => {
          const jobId = this.jobDetails()?.jobId;
          if (!jobId) return;

          const jobRegionIds = Array.isArray(raw)
            ? raw.map((r: unknown) => (typeof r === 'number' ? r : (r as { value: number })?.value))
              .filter((id): id is number => typeof id === 'number')
            : [];

          this.post<unknown>('Jobs/ReplaceJobRegionAccess', { jobId, jobRegionIds })
            .pipe(takeUntilDestroyed(this._dr))
            .subscribe({
              next: res => {
                if (res.errors?.errorCode) {
                  GeneralService.showErrorMessage(res.errors.message);
                }
              }
            });
        }
      });
  }

  getDropdownData() {
    this.getJobClients();
    this.getRateCards();
    this.getCurrencies();
  }

  getCurrencies() {
    this.get<Currency[]>('Jobs/GetCurrency')
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          this.currencies.set(
            (res.data ?? []).map(c => ({ label: `${ c.sign } ${ c.code }`, value: c.id }))
          );
        }
      });
  }

  getRateCards() {
    this.rateCardLoading.set(true);

    this.get<RateCard[]>('Clients/GetRateCardDescription')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.rateCardLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          this.rateCards.set(res.data.map(it => ({ label: it.description, value: it.rateCardId })));
        }
      });
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

          // If we need to set a venue after loading (from setFormData)
          if (setVenueAfterLoad && details?.venue) {
            // Check if a venue exists in the list, if not add it
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

    const regionNamesList = this.regionNames();
    const jobRegionAccessValue = Array.isArray(details.jobRegionAccess)
      ? details.jobRegionAccess.map((id: number) => {
        const found = regionNamesList.find(r => r.value === id);
        return found ? { value: found.value, display: found.display } : { value: id, display: String(id) };
      })
      : [];

    this._initialCurrencyId = details.currencyId ?? null;
    this._initialJobRateCardId = details.jobRateCardId ?? null;
    this._initialCurrencyLabel = this.currencies()?.find(c => c.value === this._initialCurrencyId)?.label ?? '—';
    this._initialRateCardLabel = this.rateCards()?.find(r => r.value === this._initialJobRateCardId)?.label ?? '—';

    this.form.patchValue({
      statusId: details.statusId,
      jobRegionId: details.jobRegionId,
      clientId: details.clientId,
      jobRateCardId: details.jobRateCardId ?? null,
      currencyId: details.currencyId ?? null,
      vat: details.vat ?? true,
      prePayment: details.prePayment ?? 0,
      discount: details.discount ?? 0,
      jobRegionAccess: jobRegionAccessValue,
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
    if (!input.files?.length) return;

    const file = input.files[0];
    const jobId = this.jobDetails()?.jobId;
    if (!jobId) return;

    this.uploadLoading.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];

      this.post<string>('Jobs/UploadJobDocumentAsync', {
        crewId: 0,
        jobId,
        fileName: file.name,
        fileBase64: base64
      })
        .pipe(
          takeUntilDestroyed(this._dr),
          finalize(() => {
            this.uploadLoading.set(false);
            input.value = '';
          })
        )
        .subscribe({
          next: res => {
            if (res.errors?.errorCode) {
              GeneralService.showErrorMessage(res.errors.message);
              return;
            }

            const fileName = res.data ?? file.name;
            this.documents.update(docs => [ ...docs, { fileName } ]);
            GeneralService.showSuccessMessage('File uploaded successfully');
          }
        });
    };

    reader.readAsDataURL(file);
  }

  deleteDocument(fileName: string) {
    this.deletingDocument.set(fileName);

    this.get<void>(`Jobs/DeleteJobDocumentAsync?fileName=${ encodeURIComponent(fileName) }`)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.deletingDocument.set(null))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.documents.update(docs => docs.filter(d => d.fileName !== fileName));
          GeneralService.showSuccessMessage('File deleted successfully');
        }
      });
  }

  downloadDocument(fileName: string) {
    this.downloadingDocument.set(fileName);

    this._generalService.downloadFile(`Jobs/download/${ encodeURIComponent(fileName) }`, fileName)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.downloadingDocument.set(null))
      )
      .subscribe({
        error: () => GeneralService.showErrorMessage('Download failed')
      });
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
      jobRateCardId: formValue.jobRateCardId ?? null,
      currencyId: formValue.currencyId ?? null,
      vat: formValue.vat ?? true,
      prePayment: Number(formValue.prePayment) ?? 0,
      discount: Number(formValue.discount) ?? 0,
      additionalRegionPlace: formValue.additionalRegionPlace ?? null,
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
          this.jobPartsUpdated.emit();
        }
      });
  }

  updateJobPartsTable(jobParts: JobPart[]) {
    if (!jobParts?.length) {
      this.jobPartsTableConfig.update(config => ({
        ...config,
        data: []
      }));
      return;
    }

    const tableData = jobParts.map(part => ({
      ...part,
      id: part.jobPartId,
      typeIcon: this.getJobPartTypeIcon(part.jobPartTypeId, part.typeText),
      warningIcon: this.getJobPartWarningIcon(part),
      skills: this.getSkillsString(part),
      travelFormatted: this.getTravelFormatted(part.ootCost, part.currencySign),
      netFormatted: this.formatCurrency(part.quoteCost, part.currencySign),
      grossFormatted: this.formatCurrency(part.quoteCostVat, part.currencySign)
    }));

    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: tableData
    }));
  }

  formatCurrency(value: number, currencySign: string): string {
    const sign = currencySign || '£';
    return `${ sign }${ value?.toFixed(2) ?? '0.00' }`;
  }

  getTravelFormatted(ootCost: number, currencySign: string): string {
    if (ootCost == null || ootCost <= 0) return '_';
    const amount = this.formatCurrency(ootCost, currencySign);
    return `<i class="fa-solid fa-train txt-primary f-16" title="${ amount }"></i>`;
  }

  getJobPartTypeIcon(typeId: number, typeText: string): string {
    const tooltip = typeText ? `title="${ typeText }"` : '';

    switch (typeId) {
      case 1:
        return `<i class="fa-solid fa-users txt-primary f-18" ${ tooltip }></i>`;
      case 2:
      case 5:
        return `<i class="fa-solid fa-truck txt-danger f-18" ${ tooltip }></i>`;
      case 4:
      case 6:
        return `<i class="icofont icofont-shield-alt txt-danger f-18" ${ tooltip }></i>`;
      default:
        return `<i class="fa-solid fa-briefcase txt-secondary f-18" ${ tooltip }></i>`;
    }
  }

  getJobPartWarningIcon(part: JobPart) {
    if (!part) return;
    if (!part?.warnings) return;

    const { warnings } = part;

    const tooltipText = `Number of Crew booked at this time: ${ warnings?.crew }. Threshold: ${ warnings?.warning }. Limit: ${ warnings?.limit }`;
    const tooltip = `title="${ tooltipText }"`;

    switch (part.warnings?.status) {
      case 0:
        return ``;
      case 1:
        return `<i class="fa-solid fa-warning text-warning f-18" ${ tooltip }></i>`;
      case 2:
        return `<i class="fa-solid fa-warning txt-danger f-18" ${ tooltip }></i>`;
      case 3:
        return `<i class="fa-solid fa-coins text-warning f-18" ${ tooltip }></i>`;
      default:
        return '';
    }
  }

  getSkillsString(part: JobPart): string {
    const skillMap: { key: keyof JobPart; label: string }[] = [
      { key: 'skillDriver', label: 'Driver' },
      { key: 'skillForklift', label: 'Forklift' },
      { key: 'skillIpaf', label: 'IPAF' },
      { key: 'skillSafety', label: 'Safety' },
      { key: 'skillConstruction', label: 'Construction' },
      { key: 'skillCarpenter', label: 'Carpenter' },
      { key: 'skillLightning', label: 'Lightning' },
      { key: 'skillSound', label: 'Sound' },
      { key: 'skillVideo', label: 'Video' },
      { key: 'skillTfm', label: 'TFM' },
      { key: 'skillTelehandler', label: 'Telehandler' },
      { key: 'skillScissorlift', label: 'Scissorlift' },
      { key: 'skillCherrypicker', label: 'Cherrypicker' },
      { key: 'skillFirstAid', label: 'First Aid' },
      { key: 'skillPasma', label: 'PASMA' },
      { key: 'skillFollowspot', label: 'Followspot' }
    ];

    const activeSkills = skillMap
      .filter(skill => part[skill.key] === true)
      .map(skill => skill.label);

    return activeSkills.join(' - ') || '_'
  }

  handleJobPartAction(event: TableClickedAction) {
    switch (event.action_to_perform) {
      case 'delete':
        this.deleteJobPart(event.data);
        break;
      case 'edit':
        this.editJobPart(event.data);
        break;
      case 'copy':
        this.copyJobPart(event.data);
        break;
    }
  }

  deleteJobPart(part: JobPart) {
    this.setPartDeleteLoading(part.jobPartId, true);

    this.get<void>(`Jobs/RemoveJobPart?jobPartId=${ part.jobPartId }`)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.setPartDeleteLoading(part.jobPartId, false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.removeJobPartFromTable(part.jobPartId);
          GeneralService.showSuccessMessage('Job part deleted successfully');
          this.jobPartsUpdated.emit();
        }
      });
  }

  setPartDeleteLoading(partId: number, loading: boolean) {
    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: config.data.map(item =>
        item.jobPartId === partId ? { ...item, deleteLoading: loading } : item
      )
    }));
  }

  removeJobPartFromTable(partId: number) {
    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: config.data.filter(item => item.jobPartId !== partId)
    }));
  }

  editJobPart(part: JobPart): void {
    this.editingJobPartId.set(part.jobPartId);
    this.openAddJobPartModal(this.addJobPartModalRef);
  }

  copyJobPart(part: JobPart) {
    const jobId = this.jobDetails()?.jobId;
    if (!jobId) return;

    // Set loading state on the row
    this.setPartCopyLoading(part.jobPartId, true);

    this.post<JobPartResponse>('Jobs/CopyJobPart', { jobId, jobPartId: part.jobPartId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.setPartCopyLoading(part.jobPartId, false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('Job part copied successfully');
          this.jobPartsUpdated.emit();
        }
      });
  }

  setPartCopyLoading(partId: number, loading: boolean) {
    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: config.data.map(item =>
        item.jobPartId === partId ? { ...item, copyLoading: loading } : item
      )
    }));
  }

  openAddJobPartModal(template: TemplateRef<NgbModal>): void {
    this.modalRef = this._modal.open(template, { centered: true, size: 'xl' });
  }

  onJobPartSaved(): void {
    this.modalRef?.close();
    this.editingJobPartId.set(null);
    this.jobPartsUpdated.emit();
  }

  onJobPartCancel(): void {
    this.modalRef?.close();
    this.editingJobPartId.set(null);
  }

  openAddPaymentModal(template: TemplateRef<NgbModal>) {
    this.modalRef = this._modal.open(template, { centered: true });
  }

  onPaymentAdded(partialPayments: AddPaymentResponse) {
    this.modalRef?.close();
    this.partialPaymentsUpdated.emit(partialPayments);
  }

  confirmDeletePartialPayment(payment: PartialPayment) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this payment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#FC4438'
    }).then(result => {
      if (result.isConfirmed) {
        this.deletePartialPayment(payment);
      }
    });
  }

  deletePartialPayment(payment: PartialPayment) {
    const jobId = this.jobDetails()?.jobId;
    if (!jobId) return;

    this.deletingPartialPayment.set(payment.partialPaymentId);

    this.post<AddPaymentResponse>('Jobs/RemovePartialPayment', {
      partialPaymentId: payment.partialPaymentId,
      jobId
    })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.deletingPartialPayment.set(null))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const current = this.jobDetails()?.partialPayments ?? [];
          const updatedPayments = res.data?.partialPayments ?? current.filter(p => p.partialPaymentId !== payment.partialPaymentId);
          this.partialPaymentsUpdated.emit({
            partialPayments: updatedPayments,
            ...(res.data?.jobCost != null && { jobCost: res.data.jobCost })
          });
          GeneralService.showSuccessMessage('Payment removed successfully');
        }
      });
  }

  formatPaymentDate(dateStr: string): string {
    if (!dateStr) return '';
    return this._datePipe.transform(dateStr, 'dd MMM yyyy') ?? dateStr;
  }
}
