import { Component, DestroyRef, inject, Input, signal } from '@angular/core';
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
import { ApiBase } from '../../../../../shared/bases/api-base';
import { GeneralService } from '../../../../../shared/services/general.service';
import {
  AddOrUpdateJobPartTagRequest,
  JobPartTagItem
} from '../../../../../shared/interface/jobs';
import { Schedule } from '../../../../../shared/interface/schedule';

@Component({
  selector: 'app-schedule-job-part-tag',
  standalone: true,
  imports: [ FormsModule, NgbTypeahead, NgbPopoverModule ],
  templateUrl: './schedule-job-part-tag.component.html',
  styleUrl: './schedule-job-part-tag.component.scss'
})
export class ScheduleJobPartTagComponent extends ApiBase {
  @Input({ required: true }) schedule!: Schedule;
  @Input() schedules: Schedule[] = [];

  private readonly _dr = inject(DestroyRef);

  deletingJobPartTagId = signal<number | null>(null);
  savingJobPartTagId = signal<number | null>(null);

  public jobPartTagTypeaheadFocus$ = new Subject<string>();

  tagEditDraft = '';
  private tagPopoverInitial = '';
  private tagPopoverBackendTagId: number | null = null;
  private tagPopoverCommitted = false;
  private activeJobPartTagPopover: NgbPopover | null = null;
  tagPopoverOpenPartId = signal<number | null>(null);

  readonly jobPartTagTypeahead: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    return merge(debouncedText$, this.jobPartTagTypeaheadFocus$).pipe(
      map(term => {
        const q = (term ?? '').toLowerCase().trim();
        const pool = this.buildTagSuggestionPool();
        const filtered = q ? pool.filter(s => s.toLowerCase().includes(q)) : pool;
        return filtered.slice(0, 25);
      })
    );
  };

  constructor() {
    const http = inject(HttpClient);
    super(http);
  }

  get tagDisplay(): string {
    return (this.schedule.jobPartTag?.tag ?? '').trim();
  }

  get tagLineItems(): JobPartTagItem[] {
    const nested = this.schedule.jobPartTag;
    const tagText = (nested?.tag ?? '').trim();
    return tagText && nested ? [ nested ] : [];
  }

  private buildTagSuggestionPool(): string[] {
    const list = this.schedules?.length ? this.schedules : [ this.schedule ];
    const uniq = [ ...new Set(list.map(s => (s.jobPartTag?.tag ?? '').trim()).filter(Boolean)) ];
    return uniq.sort((a, b) => a.localeCompare(b));
  }

  private preparePopover(): void {
    const items = this.tagLineItems;
    this.tagPopoverBackendTagId = items.length === 1 ? items[0].id : null;
    const synced = this.tagDisplay;
    this.tagPopoverInitial = synced;
    this.tagEditDraft = synced;
    this.tagPopoverOpenPartId.set(this.schedule.jobPartId);
  }

  onJobPartTagDraftChange(value: string): void {
    this.tagEditDraft = value;
  }

  onJobPartTagTriggerClick(popover: NgbPopover, event: Event): void {
    event.stopPropagation();
    if (popover.isOpen()) {
      this.activeJobPartTagPopover = null;
      popover.close();
      return;
    }
    this.tagPopoverCommitted = false;
    this.preparePopover();
    this.activeJobPartTagPopover = popover;
    popover.open();
  }

  onJobPartTagPopoverHidden(): void {
    const initialRaw = this.tagPopoverInitial;

    if (!this.tagPopoverCommitted) {
      this.revertTagDisplay(initialRaw);
    }

    this.tagPopoverCommitted = false;
    this.activeJobPartTagPopover = null;
    this.tagPopoverOpenPartId.set(null);
    this.tagPopoverBackendTagId = null;
  }

  commitJobPartTagFromPopover(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const jobPartId = this.schedule.jobPartId;
    const popover = this.activeJobPartTagPopover;
    if (jobPartId == null || !popover) {
      return;
    }

    const initialTrim = (this.tagPopoverInitial ?? '').trim();
    const raw = this.tagEditDraft ?? '';
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

    const jobId = this.schedule.jobId;
    const startDate = this.schedule.startDate;
    if (!jobId || !startDate) {
      GeneralService.showErrorMessage('Could not save tag: missing job or part.');
      return;
    }

    const payload: AddOrUpdateJobPartTagRequest = {
      id: this.tagPopoverBackendTagId ?? 0,
      jobId,
      jobPartId,
      tag: value,
      jobPartStartDate: this.toJobPartTagStartDateIso(startDate)
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

          const merged = this.mergeSavedTagFromResponse(res.data as JobPartTagItem | number | null | undefined, value);
          this.schedule.jobPartTag = merged;
          this.tagPopoverCommitted = true;
          GeneralService.showSuccessMessage('Tag saved');
          popover.close();
        },
        error: () => {
          GeneralService.showErrorMessage('Could not save tag');
        }
      });
  }

  private mergeSavedTagFromResponse(
    data: JobPartTagItem | number | null | undefined,
    tag: string
  ): JobPartTagItem {
    if (data && typeof data === 'object' && 'jobPartId' in data) {
      return data as JobPartTagItem;
    }
    const idFromData = typeof data === 'number' && data > 0 ? data : null;
    const id = idFromData ?? this.tagPopoverBackendTagId ?? this.schedule.jobPartTag?.id ?? 0;
    return {
      id,
      jobId: this.schedule.jobId,
      jobPartId: this.schedule.jobPartId,
      tag,
      jobPartStartDate: this.schedule.startDate
    };
  }

  private toJobPartTagStartDateIso(startDate: string): string {
    const d = new Date(startDate);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  private revertTagDisplay(initialRaw: string): void {
    const trimmed = initialRaw.trim();
    if (!trimmed) {
      this.schedule.jobPartTag = null;
      return;
    }
    const existing = this.schedule.jobPartTag;
    this.schedule.jobPartTag = existing
      ? { ...existing, tag: trimmed }
      : {
          id: 0,
          jobId: this.schedule.jobId,
          jobPartId: this.schedule.jobPartId,
          tag: trimmed
        };
  }

  onJobPartTagTypeaheadSelect(event: NgbTypeaheadSelectItemEvent<string>): void {
    this.tagEditDraft = event.item;
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
          this.schedule.jobPartTag = null;
        }
      });
  }

  clearLocalJobPartTag(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.schedule.jobPartTag = null;
  }
}
