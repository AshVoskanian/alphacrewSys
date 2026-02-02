import { Component, DestroyRef, effect, inject, input, OnInit, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { JobClient, JobDetails, JobDocument, JobPart, JobVenue } from "../../../../shared/interface/jobs";
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
import { NgbModal, NgbModalRef, NgbTooltip, NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { TableComponent } from "../../../../shared/components/ui/table/table.component";
import { TableClickedAction, TableConfigs } from "../../../../shared/interface/common";
import { AddJobpartComponent } from "../add-jobpart/add-jobpart.component";

@Component({
  selector: 'app-edit-job',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbTooltip,
    NgbTypeahead,
    DatePipe,
    CurrencyPipe,
    TableComponent,
    AddJobpartComponent
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
  private readonly _modal = inject(NgbModal);
  private readonly _generalService = inject(GeneralService);

  private modalRef: NgbModalRef;

  statuses: WritableSignal<Select2Option[]> = signal<Select2Option[]>(JOB_STATUSES);
  regions = toSignal(this._regionsService.regions);
  jobClients: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);
  jobVenues: WritableSignal<Select2Option[]> = signal<Select2Option[]>([]);

  loading = signal<boolean>(false);
  clientLoading = signal<boolean>(false);
  venueLoading = signal<boolean>(false);
  uploadLoading = signal<boolean>(false);
  documents = signal<JobDocument[]>([]);
  deletingDocument = signal<string | null>(null);
  downloadingDocument = signal<string | null>(null);

  form: FormGroup;

  jobPartsTableConfig: WritableSignal<TableConfigs> = signal<TableConfigs>({
    columns: [
      { title: '', field_value: 'typeIcon' },
      { title: 'Starts', field_value: 'starts' },
      { title: 'Time', field_value: 'time' },
      { title: 'Hours', field_value: 'hours' },
      { title: 'Crew', field_value: 'crewNumber' },
      { title: 'Travel', field_value: 'travelFormatted' }, //
      { title: 'Skills', field_value: 'skills' },
      { title: 'Ends', field_value: 'ends' },
      { title: 'Net', field_value: 'netFormatted' }, //
      { title: 'Gross', field_value: 'grossFormatted' } //
    ],
    row_action: [
      { label: 'Delete', icon: 'fa-solid fa-trash txt-danger', class: 'square-white', action_to_perform: 'delete', modal: true, model_text: 'Are you sure you want to delete this job part?' },
      { label: 'Edit', icon: 'fa-solid fa-pen-to-square txt-primary', class: 'square-white', action_to_perform: 'edit' },
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
            this.documents.update(docs => [...docs, { fileName }]);
            GeneralService.showSuccessMessage('File uploaded successfully');
          }
        });
    };

    reader.readAsDataURL(file);
  }

  deleteDocument(fileName: string) {
    this.deletingDocument.set(fileName);

    this.get<void>(`Jobs/DeleteJobDocumentAsync?fileName=${encodeURIComponent(fileName)}`)
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

    this._generalService.downloadFile(`Jobs/download/${encodeURIComponent(fileName)}`, fileName)
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
      skills: this.getSkillsString(part),
      travelFormatted: this.formatCurrency(part.ootCost, part.currencySign),
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
    return `${sign}${value?.toFixed(2) ?? '0.00'}`;
  }

  getJobPartTypeIcon(typeId: number, typeText: string): string {
    const tooltip = typeText ? `title="${typeText}"` : '';

    switch (typeId) {
      case 1:
        return `<i class="fa-solid fa-users txt-primary f-18" ${tooltip}></i>`;
      case 2:
      case 5:
        return `<i class="fa-solid fa-truck txt-danger f-18" ${tooltip}></i>`;
      case 4:
      case 6:
        return `<i class="icofont icofont-shield-alt txt-danger f-18" ${tooltip}></i>`;
      default:
        return `<i class="fa-solid fa-briefcase txt-secondary f-18" ${tooltip}></i>`;
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

    return activeSkills.join(' - ');
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

    this.get<void>(`Jobs/RemoveJobPart?jobPartId=${part.jobPartId}`)
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

  editJobPart(part: JobPart) {
    // TODO: Implement edit functionality
    console.log('Edit job part:', part);
  }

  copyJobPart(part: JobPart) {
    const jobId = this.jobDetails()?.jobId;
    if (!jobId) return;

    // Set loading state on the row
    this.setPartCopyLoading(part.jobPartId, true);

    this.post<JobPart[]>('Jobs/CopyJobPart', { jobId, jobPartId: part.jobPartId })
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

          this.updateJobPartsTable(res.data);
          GeneralService.showSuccessMessage('Job part copied successfully');
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

  openAddJobPartModal(template: TemplateRef<NgbModal>) {
    this.modalRef = this._modal.open(template, { centered: true, size: 'xl' });
  }

  onJobPartAdded() {
    this.modalRef?.close();
    // TODO: Refresh job details to get updated job parts
  }
}
