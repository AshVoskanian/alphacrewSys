import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  WritableSignal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  merge,
  Observable,
  OperatorFunction,
  Subject
} from 'rxjs';
import {
  NgbPopover,
  NgbPopoverModule,
  NgbTypeahead,
  NgbTypeaheadSelectItemEvent
} from '@ng-bootstrap/ng-bootstrap';
import { ApiBase } from '../../../../shared/bases/api-base';
import { GeneralService } from '../../../../shared/services/general.service';
import {
  AddOrUpdateJobPartTagRequest,
  JobDetails,
  JobPart,
  JobPartResponse,
  JobPartTagItem,
  JobScheduleWarning
} from '../../../../shared/interface/jobs';
import { TableComponent } from '../../../../shared/components/ui/table/table.component';
import { TableClickedAction, TableConfigs } from '../../../../shared/interface/common';

@Component({
  selector: 'app-job-parts',
  standalone: true,
  imports: [ FormsModule, NgbTypeahead, NgbPopoverModule, TableComponent ],
  templateUrl: './job-parts.component.html',
  styleUrl: './job-parts.component.scss'
})
export class JobPartsComponent extends ApiBase {
  jobDetails = input<JobDetails | undefined>();
  jobWarnings = input<JobScheduleWarning[] | undefined>();

  jobPartsUpdated = output<void>();
  editPart = output<JobPart>();
  addPart = output<void>();

  private readonly _dr = inject(DestroyRef);

  deletingJobPartTagId = signal<number | null>(null);
  savingJobPartTagId = signal<number | null>(null);

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
      { title: 'Gross', field_value: 'grossFormatted' },
      { title: 'Tags', field_value: 'jobPartTag', type: 'template' }
    ],
    row_action_before: [
      {
        label: 'Edit',
        icon: 'fa-solid fa-pen-to-square txt-primary',
        class: 'square-white',
        action_to_perform: 'edit',
        showOnHover: true
      }
    ],
    row_action: [
      {
        label: 'Copy',
        icon: 'fa-solid fa-copy txt-secondary',
        class: 'square-white',
        action_to_perform: 'copy'
      },
      {
        label: 'Delete',
        icon: 'fa-solid fa-trash txt-danger',
        class: 'square-white',
        action_to_perform: 'delete',
        modal: true,
        model_text: 'Are you sure you want to delete this job part?'
      }
    ],
    data: []
  });

  public jobPartTagTypeaheadFocus$ = new Subject<string>();

  jobPartTagSuggestions: WritableSignal<string[]> = signal<string[]>([]);

  tagEditDraft = '';
  private tagPopoverRow: { jobPartId: number } | null = null;
  private readonly tagDraftByJobPartId = new Map<number, string>();
  private readonly tagPopoverInitialByPartId = new Map<number, string>();
  private activeJobPartTagPopover: NgbPopover | null = null;
  private tagPopoverBackendTagId: number | null = null;
  private tagPopoverCommitted = false;
  tagPopoverOpenPartId = signal<number | null>(null);

  readonly jobPartTagTypeahead: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    return merge(debouncedText$, this.jobPartTagTypeaheadFocus$).pipe(
      map(term => {
        const q = (term ?? '').toLowerCase().trim();
        const pool = this.jobPartTagSuggestions();
        const filtered = q
          ? pool.filter(s => s.toLowerCase().includes(q))
          : pool;
        return filtered.slice(0, 25);
      })
    );
  };

  constructor() {
    const http = inject(HttpClient);
    super(http);

    effect(() => {
      const details = this.jobDetails();
      if (details) {
        this.updateJobPartsTable(details.jobParts);
      }
    });

    effect(() => {
      const warnings = this.jobWarnings();
      if (warnings) {
        this.setPartWarnings(warnings);
      }
    });
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

    this.updateJobPartsTable(this.jobDetails()?.jobParts);
  }

  updateJobPartsTable(jobParts: JobPart[] | undefined): void {
    const catalogTags = this.jobDetails()?.jobPartTags ?? [];
    this.refreshJobPartTagSuggestions(catalogTags);

    if (!jobParts?.length) {
      this.jobPartsTableConfig.update(config => ({
        ...config,
        data: []
      }));
      return;
    }

    const tableData = jobParts.map(part => {
      const nested = part.jobPartTag;
      const tagText = (nested?.tag ?? '').trim();
      const lineItems = tagText && nested ? [ nested ] : [];
      return {
        ...part,
        id: part.jobPartId,
        tagLineItems: lineItems,
        tagDisplay: this.resolveJobPartTagDisplay(part),
        typeIcon: this.getJobPartTypeIcon(part.jobPartTypeId, part.typeText),
        warningIcon: this.getJobPartWarningIcon(part),
        skills: this.getSkillsString(part),
        travelFormatted: this.getTravelFormatted(part.ootCost, part.currencySign),
        netFormatted: this.formatCurrency(part.quoteCost, part.currencySign),
        grossFormatted: this.formatCurrency(part.quoteCostVat, part.currencySign)
      };
    });

    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: tableData
    }));
  }

  prepareJobPartTagPopover(row: { jobPartId: number; tagDisplay?: string; tagLineItems?: JobPartTagItem[] }): void {
    this.tagPopoverCommitted = false;
    this.tagPopoverRow = row;
    const items = row.tagLineItems ?? [];
    this.tagPopoverBackendTagId = items.length === 1 ? items[0].id : null;
    const synced = row.tagDisplay ?? '';
    this.tagPopoverInitialByPartId.set(row.jobPartId, synced);
    this.tagDraftByJobPartId.set(row.jobPartId, synced);
    this.tagEditDraft = synced;
    this.tagPopoverOpenPartId.set(row.jobPartId);
  }

  onJobPartTagDraftChange(value: string): void {
    const id = this.tagPopoverRow?.jobPartId;
    if (id == null) {
      return;
    }
    this.tagDraftByJobPartId.set(id, value);
    this.tagEditDraft = value;
  }

  onJobPartTagTriggerClick(popover: NgbPopover, row: { jobPartId: number; tagDisplay?: string; tagLineItems?: JobPartTagItem[] }, event: Event): void {
    event.stopPropagation();
    if (popover.isOpen()) {
      this.activeJobPartTagPopover = null;
      popover.close();
      return;
    }
    this.prepareJobPartTagPopover(row);
    this.activeJobPartTagPopover = popover;
    popover.open();
  }

  onJobPartTagPopoverHidden(jobPartId: number): void {
    const initialRaw = this.tagPopoverInitialByPartId.get(jobPartId) ?? '';

    if (!this.tagPopoverCommitted) {
      this.revertJobPartTagDisplay(jobPartId, initialRaw);
    }

    this.tagPopoverCommitted = false;
    this.tagDraftByJobPartId.delete(jobPartId);
    this.tagPopoverInitialByPartId.delete(jobPartId);
    this.activeJobPartTagPopover = null;
    this.tagPopoverOpenPartId.set(null);
    this.tagPopoverBackendTagId = null;

    if (this.tagPopoverRow?.jobPartId === jobPartId) {
      this.tagPopoverRow = null;
    }
  }

  commitJobPartTagFromPopover(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const jobPartId = this.tagPopoverRow?.jobPartId;
    const popover = this.activeJobPartTagPopover;
    if (jobPartId == null || !popover) {
      return;
    }

    const initialRaw = this.tagPopoverInitialByPartId.get(jobPartId) ?? '';
    const initialTrim = initialRaw.trim();
    const raw = this.tagDraftByJobPartId.get(jobPartId) ?? this.tagEditDraft ?? '';
    const value = raw.trim();

    if (value === initialTrim) {
      this.tagPopoverCommitted = true;
      popover.close();
      return;
    }

    if (!value) {
      this.tagPopoverCommitted = true;
      popover.close();
      return;
    }

    const jobId = this.jobDetails()?.jobId;
    const part = this.jobDetails()?.jobParts?.find(p => p.jobPartId === jobPartId);
    if (!jobId || !part?.startDate) {
      GeneralService.showErrorMessage('Could not save tag: missing job or part.');
      return;
    }

    const payload: AddOrUpdateJobPartTagRequest = {
      id: this.tagPopoverBackendTagId ?? 0,
      jobId,
      jobPartId,
      tag: value,
      jobPartStartDate: this.toJobPartTagStartDateIso(part.startDate)
    };

    this.savingJobPartTagId.set(jobPartId);

    this.post<unknown, AddOrUpdateJobPartTagRequest>('Jobs/AddOrUpdateJobPartTag', payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.savingJobPartTagId.set(null))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.jobPartsTableConfig.update(config => ({
            ...config,
            data: config.data.map(item =>
              item.jobPartId === jobPartId
                ? { ...item, tagDisplay: value, tagLineItems: item.tagLineItems ?? [] }
                : item
            )
          }));
          this.tagPopoverCommitted = true;
          GeneralService.showSuccessMessage('Tag saved');
          this.mergeJobPartTagSuggestion(value);
          this.jobPartsUpdated.emit();
          popover.close();
        },
        error: () => {
          GeneralService.showErrorMessage('Could not save tag');
        }
      });
  }

  private toJobPartTagStartDateIso(startDate: string): string {
    const d = new Date(startDate);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  private revertJobPartTagDisplay(jobPartId: number, tagDisplay: string): void {
    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: config.data.map(item =>
        item.jobPartId === jobPartId
          ? { ...item, tagDisplay, tagLineItems: item.tagLineItems ?? [] }
          : item
      )
    }));
  }

  onJobPartTagTypeaheadSelect(event: NgbTypeaheadSelectItemEvent<string>): void {
    const id = this.tagPopoverRow?.jobPartId;
    this.tagEditDraft = event.item;
    if (id != null) {
      this.tagDraftByJobPartId.set(id, event.item);
    }
  }

  deleteJobPartTagById(event: Event, tagId: number): void {
    event.stopPropagation();
    event.preventDefault();

    this.deletingJobPartTagId.set(tagId);

    this.get<unknown>('Jobs/RemoveJobPartTag', { tagId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.deletingJobPartTagId.set(null))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('Tag removed');
          this.updateJobPartsTable(this.jobDetails()?.jobParts);
          this.jobPartsUpdated.emit();
        }
      });
  }

  private refreshJobPartTagSuggestions(items: JobPartTagItem[]): void {
    const uniq = [
      ...new Set(items.map(i => (i.tag ?? '').trim()).filter(Boolean))
    ].sort((a, b) => a.localeCompare(b));
    this.jobPartTagSuggestions.set(uniq);
  }

  private mergeJobPartTagSuggestion(value: string): void {
    if (!value) {
      return;
    }
    const cur = this.jobPartTagSuggestions();
    if (cur.some(x => x.toLowerCase() === value.toLowerCase())) {
      return;
    }
    this.jobPartTagSuggestions.update(arr => [ ...arr, value ].sort((a, b) => a.localeCompare(b)));
  }

  private resolveJobPartTagDisplay(part: JobPart): string {
    const nested = (part.jobPartTag?.tag ?? '').trim();
    if (nested) {
      return nested;
    }
    return (part.tag ?? '').trim();
  }

  formatCurrency(value: number, currencySign: string): string {
    const sign = currencySign || '뿯½';
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

    return activeSkills.join(' - ') || '_';
  }

  handleJobPartAction(event: TableClickedAction): void {
    switch (event.action_to_perform) {
      case 'delete':
        this.deleteJobPart(event.data);
        break;
      case 'edit':
        this.editPart.emit(event.data);
        break;
      case 'copy':
        this.copyJobPart(event.data);
        break;
    }
  }

  deleteJobPart(part: JobPart): void {
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

  setPartDeleteLoading(partId: number, loading: boolean): void {
    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: config.data.map(item =>
        item.jobPartId === partId ? { ...item, deleteLoading: loading } : item
      )
    }));
  }

  removeJobPartFromTable(partId: number): void {
    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: config.data.filter(item => item.jobPartId !== partId)
    }));
  }

  copyJobPart(part: JobPart): void {
    const jobId = this.jobDetails()?.jobId;
    if (!jobId) return;

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

  setPartCopyLoading(partId: number, loading: boolean): void {
    this.jobPartsTableConfig.update(config => ({
      ...config,
      data: config.data.map(item =>
        item.jobPartId === partId ? { ...item, copyLoading: loading } : item
      )
    }));
  }
}
