import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  QueryList,
  Renderer2,
  RendererStyleFlags2,
  signal,
  ViewChild,
  ViewChildren,
  WritableSignal
} from '@angular/core';
import {
  NgbActiveOffcanvas,
  NgbDropdownModule,
  NgbModal,
  NgbModalRef,
  NgbPopover,
  NgbPopoverModule,
  NgbTooltipModule
} from "@ng-bootstrap/ng-bootstrap";
import {
  Crew,
  CrewManager,
  JobPartClashing,
  JobPartCrew,
  Schedule,
  ShiftCrewDetails
} from "../../../../../shared/interface/schedule";
import { JobPartTagItem } from '../../../../../shared/interface/jobs';
import { CardComponent } from "../../../../../shared/components/ui/card/card.component";
import {
  CrewFilterPipe,
  crewIsUnavailableForSelectedJobParts
} from "../../../../../shared/pipes/crew-filter.pipe";
import { FormGroup, FormsModule } from "@angular/forms";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { ScheduleService } from "../../schedule.service";
import { GeneralService } from "../../../../../shared/services/general.service";
import { AsyncPipe, DatePipe, DOCUMENT, NgClass, NgStyle } from '@angular/common';
import { finalize, Observable } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FilterPipe } from "../../../../../shared/pipes/filter.pipe";
import { ConfirmModalComponent } from "../../../../../shared/components/ui/confirm-modal/confirm-modal.component";

@Component({
  selector: 'app-crew-list',
  imports: [
    CardComponent, DatePipe, AsyncPipe, FilterPipe, NgClass,
    FormsModule, NgbPopoverModule, NgbTooltipModule, NgbDropdownModule, NgStyle, ConfirmModalComponent
  ],
  providers: [CrewFilterPipe],
  templateUrl: './crew-list.component.html',
  styleUrl: './crew-list.component.scss'
})
export class CrewListComponent extends ApiBase implements OnInit, OnChanges {
  private _modal = inject(NgbModal);
  private _dr: DestroyRef = inject(DestroyRef);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _filterPipe: CrewFilterPipe = inject(CrewFilterPipe);
  private _scheduleService = inject(ScheduleService);
  private readonly _activeOffcanvas = inject(NgbActiveOffcanvas, { optional: true });
  private readonly _document = inject(DOCUMENT);
  private readonly _renderer = inject(Renderer2);

  /** ng-bootstrap hardcodes body dropdown wrapper z-index 1055 — must exceed .common-offcanvas (9999). */
  private static readonly tagFilterDropdownZ = '10050';

  @Input() title: string;
  @Input() crewList: Array<Crew> = [];
  @Input() isJobScoped = false;
  @Output() panelClose = new EventEmitter<void>();

  @ViewChildren(NgbPopover) popovers!: QueryList<NgbPopover>;
  @ViewChild('confirmModal') confirmModal: any;
  @ViewChild('crewManager') crewManager!: ElementRef<HTMLElement>;

  private modalRef!: NgbModalRef;

  form: FormGroup;

  searchKey: string = '';
  loading: boolean = false;
  allAreSelected: boolean = false;
  allAreSelectedForSMS: boolean = false;
  showBtnOptions: boolean = false;
  showLimitError: boolean | undefined = false;
  crewManagerLoader: boolean = false;
  crewClashingLoader: boolean = false;
  notificationsLoader: boolean = false;
  listLoading$: Observable<boolean> = this._scheduleService.crewListLoading.asObservable();
  selectedSchedule: Schedule | null;

  shiftCrewDetails: WritableSignal<Array<ShiftCrewDetails>> = signal([]);
  btnDropdownItems: WritableSignal<Array<{
    type: 'new' | 'all' | 'current' | 'checkedShifts',
    name: string
  }>> = signal([
    {
      type: 'all',
      name: 'Save All Future Parts'
    },
    {
      type: 'new',
      name: 'Save New Crew To All Future Parts'
    },
    {
      type: 'checkedShifts',
      name: 'Save New Crew To Selected Parts'
    }
  ]);

  regions = [
    { id: 1, title: 'Lon', class: 'primary', checked: true },
    { id: 2, title: 'Birm', class: 'primary', checked: false },
    { id: 5, title: 'Manch', class: 'primary', checked: false },
    { id: 3, title: 'Nice', class: 'primary', checked: false },
    { id: 6, title: 'Brist', class: 'primary', checked: false },
    { id: 7, title: 'Scot', class: 'primary', checked: false },
    { id: 4, title: 'Par', class: 'primary', checked: false },
    { id: 8, title: 'Bcn', class: 'primary', checked: false },
    { id: 10, title: 'NY', class: 'primary', checked: false },
    { id: 11, title: 'Berl', class: 'primary', checked: false },
  ];

  levels = [
    { id: 1, title: 'PBC', class: 'primary', checked: true },
    { id: 2, title: 'L1', class: 'primary', checked: false },
    { id: 3, title: 'L2', class: 'primary', checked: false },
    { id: 5, title: 'L3', class: 'primary', checked: false },
    { id: 8, title: 'L4', class: 'primary', checked: false },
    { id: 13, title: 'CC', class: 'primary', checked: false },
    { id: 32, title: 'S', class: 'primary', checked: false }
  ];

  jobPartClashing: Array<JobPartClashing> = [];

  /**
   * Tag rows derived from `jobPartClashing[].jobPartTag` (same shape as `JobPartTagItem` for filters).
   */
  jobPartTagsCatalog: JobPartTagItem[] = [];
  /** Unique `tag` labels for the dropdown (trimmed; duplicates collapsed case-insensitively). */
  jobPartTagsForFilter: string[] = [];
  /** Normalized tag keys (`normalizeTagKey`) selected in the header tag filter (multi-select). */
  private readonly selectedTagFilterKeys = new Set<string>();

  /**
   * Fixed chrome subtracted from 100dvh for the scrollable crew list: offcanvas header, region/level
   * rows, both cards (padding + second card toolbar), form margins, panel padding (~12px sides).
   * Kept separate from #crewManager height so the list can grow on small screens.
   */
  private readonly crewListViewportReservePx = 380;

  ngOnInit() {
    this.getSelectedSchedule();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['crewList'] || !this.crewList?.length || !this.selectedSchedule) {
      return;
    }
    this.getCrewClashing();
    this.syncCrewlistFlagsFromSelectedSchedule();
  }

  /** Keeps isAlreadyAssigned / filters in sync when crewList loads after selectedShift (e.g. inline panel always in DOM). */
  private syncCrewlistFlagsFromSelectedSchedule(): void {
    const schedule = this.selectedSchedule;
    if (!schedule) {
      return;
    }

    const selectedCrewIds = new Set(schedule.crews.map(c => c.crewId));
    const selectedCrewRegionIds = new Set(schedule.crews.map(c => c.regionId));
    const selectedCrewLevelIds = new Set(schedule.crews.map(c => c.levelCrewingWeighting));

    this.crewList.forEach(crew => {
      crew.isChecked = selectedCrewIds.has(crew.crewId);
      crew.isAlreadyAssigned = selectedCrewIds.has(crew.crewId);
    });

    // Uncheck checked crew for SMS
    this.crewList.forEach(crew => crew.isCheckedForSMS = false);
    this.allAreSelectedForSMS = false;

    // Check existing crew level filters
    this.levels.forEach(level => {
      level.checked = selectedCrewLevelIds.has(level.id);
    })

    // Check existing crew region filters
    this.regions.forEach(region => {
      region.checked = selectedCrewRegionIds.has(region.id);
    })

    if (!this.levels.some(it => it.checked)) {
      this.levels[0].checked = true;
    }
  }

  get maxHeight(): string {
    const managerEl = this.crewManager?.nativeElement;
    const reserve = this.crewListViewportReservePx;

    // No job-part table yet (#crewManager only exists when jobPartClashing has rows)
    if (!managerEl) {
      return `max(10rem, calc(100dvh - ${reserve}px))`;
    }

    const managerHeight = managerEl.offsetHeight;
    return `max(10rem, calc(100dvh - ${managerHeight + reserve}px))`;
  }

  /**
   * Recomputed each change detection. Pure `filter` pipe caches by input reference, so in-place
   * `isAlreadyAssigned` updates on `crewList` items would not refresh the two @for lists.
   */
  get assignedCrewRows(): Crew[] {
    return this.crewList.filter(m => m.isAlreadyAssigned === true);
  }

  get selectableCrewRows(): Crew[] {
    const notAssigned = this.crewList.filter(m => m.isAlreadyAssigned === false);
    return this._filterPipe.transform(
      notAssigned,
      this.getSelectedData('regions'),
      this.getSelectedData('levels'),
      this.getSelectedData('jobParts'),
      this.searchKey
    );
  }

  /** Used with `@let jpIds = getSelectedData('jobParts')` so availability is computed once per list, not per binding. */
  crewUnavailableForJobParts(crew: Crew, jobPartIds: number[]): boolean {
    return crewIsUnavailableForSelectedJobParts(crew, jobPartIds);
  }

  getAlreadyAssignedCrewCountByLevel(levelId: number) {
    const selectedCrewLevelIds = this.selectedSchedule.crews.map(c => c.levelCrewingWeighting);
    return selectedCrewLevelIds.filter(it => it === levelId).length
  }

  hoursDifference(startDateIso: string, endDateIso: string) {
    return GeneralService.calculateHoursDifference(startDateIso, endDateIso);
  }

  getSelectedSchedule(): void {
    this._scheduleService.selectedShift$
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe((schedule: Schedule | null) => {
        if (!schedule) return;

        this.selectedSchedule = schedule;

        this.syncCrewlistFlagsFromSelectedSchedule();

        this.getCrewManager();
        this.getCrewClashing();
      });
  }

  closeOffcanvas() {
    if (this._activeOffcanvas) {
      this._activeOffcanvas.close();
    } else {
      this.panelClose.emit();
    }
  }

  getSelectedData(type: 'regions' | 'levels' | 'crew' | 'onlyNewCrew' | 'jobParts'): Array<number> {
    if (type === 'regions') {
      return this.regions.filter(it => it.checked).map(it => it.id);
    }

    if (type === 'levels') {
      return this.levels.filter(it => it.checked).map(it => it.id);
    }

    if (type === 'crew') {
      return this.crewList.filter(it => it.isChecked).map(it => it.crewId);
    }

    if (type === 'onlyNewCrew') {
      return this.crewList.filter(it => it.isChecked && !it.isAlreadyAssigned).map(it => it.crewId);
    }

    if (type === 'jobParts') {
      return this.jobPartClashing.filter(it => it.checked && !it.isCrewLocked).map(it => it.jobPartId);
    }

    return [];
  }

  selectAll() {
    this.crewList.forEach(it => it.isChecked = this.allAreSelected);

    const selectedCount = this.crewList.filter(it => it.isChecked).length;
    if (!this.isJobScoped) {
      this.showLimitError = !!this.selectedSchedule && selectedCount > this.selectedSchedule.crewNumber;
    }
  }

  areAllChecked(crew: Array<Crew>): boolean {
    return !crew.some(it => !it.isChecked);
  }

  areAllCheckedForSMS(crew: Array<Crew>): boolean {
    return !crew.some(it => !it.isCheckedForSMS);
  }

  crewSelect(crew: Crew): void {
    crew.isChecked = !crew.isChecked;

    const selectedRegions = this.getSelectedData('regions');
    const selectedLevels = this.getSelectedData('levels');

    const filteredCrew = this._filterPipe.transform(this.crewList, selectedRegions, selectedLevels);
    this.allAreSelected = this.areAllChecked(filteredCrew);

    const selectedCount = this.crewList.filter(it => it.isChecked).length;
    if (!this.isJobScoped) {
      this.showLimitError = !!this.selectedSchedule && selectedCount > this.selectedSchedule.crewNumber;
    }
  }

  selectCrewForSMS(crew: Crew) {
    crew.isCheckedForSMS = !crew.isCheckedForSMS;

    const selectedRegions = this.getSelectedData('regions');
    const selectedLevels = this.getSelectedData('levels');

    const filteredCrew = this._filterPipe.transform(this.crewList, selectedRegions, selectedLevels);
    this.allAreSelectedForSMS = this.areAllCheckedForSMS(filteredCrew);
  }

  saveCrew(type: 'current' | 'all' | 'new' | 'checkedShifts') {
    this.showBtnOptions = false;

    this.addCrewToShift(type);
  }

  addCrewToShift(type: 'current' | 'all' | 'new' | 'checkedShifts') {
    if (this.loading) return;
    this.loading = true;

    const checkedClashingCrew = this.jobPartClashing.filter(it => it.checked && !it.isCrewLocked);
    const jobPartIds = checkedClashingCrew?.length > 0 ? checkedClashingCrew.map(it => it.jobPartId) : [];
    const newCrewOnly = type === 'new' || type === 'checkedShifts';

    const data = {
      jobId: this.selectedSchedule.jobId,
      jobPartId: type === 'checkedShifts' ? 0 : this.selectedSchedule?.jobPartId,
      jobPartIds: type === 'checkedShifts' ? jobPartIds : [],
      crewId: this.getSelectedData('crew'),
      newCrewOnly,
    }

    if (type === 'current') {
      delete data.jobId
    }

    this.post<Array<Schedule>>('Schedule/updatejobpartcrew', data).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.errors?.errorCode) {
          GeneralService.showErrorMessage(res.errors.message);
          return;
        } else {
          res.data[0].isJobScoped = this.isJobScoped;
          this._scheduleService.crewUpdate$.next(res.data);
          GeneralService.showSuccessMessage();
          this.closeOffcanvas();
        }
      }
    })
  }

  getCrewManager() {
    this.crewManagerLoader = true;

    this.get<Array<CrewManager>>(`Crew/GetCrewManager/${ this.selectedSchedule.jobPartId }`)
      .subscribe({
        next: res => {
          this.crewManagerLoader = false;

          for (let crew of this.crewList) {
            const match = res?.data?.find(r => r.crewID === crew.crewId);
            if (match) {
              crew.crewHours = match.crewHours;
              crew.conflict = match.conflict;
              crew.holiday = match.holiday;
              crew.struckOut = match.struckOut;
              crew.turnedDown = match.turnedDown;
              crew.cssColour = match.cssColour;
              crew.notificationStatusId = match.notificationStatusId;
              crew.notificationStatusText = match.notificationStatusText;
              crew.rating = match.rating;
              crew.cleintHours = match.cleintHours;
              crew.experienceHours = match.experienceHours;
              crew.recommended = match.recommended;
            }
          }
        }
      })
  }

  /**
   * Merges `isCrewLocked` with backend typo `isCrewBlokced` into a single boolean.
   */
  private normalizeJobPartClashingLock(part: JobPartClashing): JobPartClashing {
    const raw = part as JobPartClashing & { isCrewBlokced?: boolean };
    return {
      ...part,
      isCrewLocked: Boolean(part.isCrewLocked ?? raw.isCrewBlokced),
    };
  }

  /** Rows in the clashing table that can still be checked for bulk actions. */
  hasSelectableClashingParts(): boolean {
    return this.jobPartClashing.some(p => !p.isCrewLocked);
  }

  getCrewClashing(): void {
    this.crewClashingLoader = true;
    this.jobPartClashing = [];
    this.selectedTagFilterKeys.clear();
    this.jobPartTagsCatalog = [];
    this.jobPartTagsForFilter = [];

    this.get<Array<JobPartClashing>>(`Crew/GetCrewClashing/${ this.selectedSchedule.jobPartId }`)
      .pipe(finalize(() => this.crewClashingLoader = false))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) return;

          this.jobPartClashing = (res.data ?? []).map(part => this.normalizeJobPartClashingLock(part));

          const selected = this.jobPartClashing.find(it => it.jobPartId === this.selectedSchedule.jobPartId);

          if (selected?.startDate) {
            const selectedDate = new Date(selected.startDate);

            this.jobPartClashing = this.jobPartClashing.filter(it => new Date(it.startDate) >= selectedDate);

            this.jobPartClashing.forEach(it => {
              it.checked = !it.isCrewLocked && it.jobPartId === this.selectedSchedule.jobPartId;
            });
          }

          this.updateNotClashingCounts(this.jobPartClashing);
          this.selectedTagFilterKeys.clear();
          this.rebuildJobPartTagsFromClashing();
        }
      });
  }

  /** Opens dropdown: z-index only (tags come from `GetCrewClashing`). */
  onTagFilterDropdownOpen(open: boolean): void {
    if (open) {
      this.patchTagFilterDropdownZIndex();
    }
  }

  /**
   * NgbDropdown with `container="body"` sets inline `z-index: 1055` on the wrapper div.
   * Popper may refresh styles — re-apply after layout so the menu stays above offcanvas.
   */
  private patchTagFilterDropdownZIndex(): void {
    const apply = (): void => {
      const el = this._document.body.querySelector(
        '.crew-list-tag-filter-dropdown'
      ) as HTMLElement | null;
      if (el) {
        this._renderer.setStyle(
          el,
          'z-index',
          CrewListComponent.tagFilterDropdownZ,
          RendererStyleFlags2.Important
        );
      }
    };
    queueMicrotask(apply);
    requestAnimationFrame(apply);
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  private rebuildJobPartTagsFromClashing(): void {
    const rows: JobPartTagItem[] = [];
    for (const part of this.jobPartClashing) {
      const tagObj = part.jobPartTag;
      const text = (tagObj?.tag ?? '').trim();
      if (!tagObj || !text) {
        continue;
      }
      rows.push({
        ...tagObj,
        jobId: tagObj.jobId || part.jobId,
        jobPartId: tagObj.jobPartId || part.jobPartId,
        tag: text
      });
    }
    this.jobPartTagsCatalog = rows.sort((a, b) => {
      const ta = (a.tag ?? '').localeCompare(b.tag ?? '', undefined, { sensitivity: 'base' });
      if (ta !== 0) {
        return ta;
      }
      return a.jobPartId - b.jobPartId;
    });
    this.jobPartTagsForFilter = this.buildUniqueTagLabels(this.jobPartTagsCatalog);
    this._cdr.markForCheck();
  }

  private normalizeTagKey(tag: string | null | undefined): string {
    return (tag ?? '').trim().toLowerCase();
  }

  /** One entry per distinct tag text (case-insensitive); label is first trimmed spelling seen. */
  private buildUniqueTagLabels(rows: JobPartTagItem[]): string[] {
    const byKey = new Map<string, string>();
    for (const row of rows) {
      const raw = (row.tag ?? '').trim();
      if (!raw) {
        continue;
      }
      const key = this.normalizeTagKey(raw);
      if (!byKey.has(key)) {
        byKey.set(key, raw);
      }
    }
    return [ ...byKey.values() ].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }

  isTagFilterSelected(tagLabel: string): boolean {
    return this.selectedTagFilterKeys.has(this.normalizeTagKey(tagLabel));
  }

  get selectedTagFilterCount(): number {
    return this.selectedTagFilterKeys.size;
  }

  toggleTagFilterSelection(tagLabel: string, checked: boolean): void {
    const key = this.normalizeTagKey(tagLabel);
    if (!key) {
      return;
    }
    if (checked) {
      this.selectedTagFilterKeys.add(key);
    } else {
      this.selectedTagFilterKeys.delete(key);
    }
    this.applySelectedTagsToJobPartChecks();
  }

  /**
   * Check every clashing row whose `jobPartId` has any of the selected tag strings in the catalog;
   * uncheck rows that do not match any selected tag.
   */
  private applySelectedTagsToJobPartChecks(): void {
    const selectedPartIds = new Set<number>();
    for (const key of this.selectedTagFilterKeys) {
      for (const row of this.jobPartTagsCatalog) {
        if (this.normalizeTagKey(row.tag) === key) {
          selectedPartIds.add(row.jobPartId);
        }
      }
    }
    this.jobPartClashing.forEach(part => {
      if (part.isCrewLocked) {
        part.checked = false;
        return;
      }
      part.checked = selectedPartIds.has(part.jobPartId);
    });
    this.jobPartSelect();
    this._cdr.markForCheck();
  }

  tagsLabelForClashingRow(jobPartId: number): string {
    const part = this.jobPartClashing.find(p => p.jobPartId === jobPartId);
    return (part?.jobPartTag?.tag ?? '').trim();
  }

  onJobPartRowCheckboxChange(): void {
    this.selectedTagFilterKeys.clear();
    this.jobPartSelect();
  }

  updateNotClashingCounts(data: JobPartClashing[]): void {
    // Reset all notClashingInfo
    this.crewList.forEach(crew => {
      crew.notClashingInfo = { unassignedCrewCount: 0, details: {} };
    });

    // Populate notClashingInfo
    data.forEach(jobPart => {
      jobPart.crewClashingList?.forEach(crew => {
        if (!crew.clashing) {
          const matched = this.crewList.find(c => c.crewId === crew.crewId);
          if (!matched) return;

          const info = matched.notClashingInfo!;
          info.details[jobPart.jobPartId] = (info.details[jobPart.jobPartId] ?? 0) + 1;
          info.unassignedCrewCount = Object.values(info.details).reduce((sum: number, val: number) => sum + val, 0);
        }
      });
    });

    // Update jobPartIds for checked ones
    this.crewList.forEach(crew => {
      crew.jobPartIds = [];

      this.jobPartClashing
        .filter(jp => jp.checked && !jp.isCrewLocked)
        .forEach(jp => {
          if (crew.notClashingInfo?.details?.[jp.jobPartId] > 0) {
            crew.jobPartIds.push(jp.jobPartId);
          }
        });
    });
    this._cdr.detectChanges();
  }

  sendNotification(crew?: Crew, checkCrewCount = true, appOnly = false) {
    if (this.notificationsLoader || crew?.notificationLoading) return;

    const selectedCrewForSMS = this.crewList.filter(it => it.isCheckedForSMS).map(it => it.crewId);

    // if (selectedCrewForSMS && selectedCrewForSMS.length > 12 && checkCrewCount) {
    //   this.openConfirmModal(this.confirmModal);
    //   return;
    // }

    if (crew) {
      crew.notificationLoading = true;
    } else {
      this.notificationsLoader = true;
    }

    const selectedJps = this.jobPartClashing.filter(it => it.checked && !it.isCrewLocked);
    const isAnyJpSelected = this.jobPartClashing.some(it => it.checked && !it.isCrewLocked);

    const data = {
      jobId: this.selectedSchedule.jobId,
      jobPartId: isAnyJpSelected ? selectedJps.map(it => it.jobPartId) : [ this.selectedSchedule.jobPartId ],
      crewId: crew ? [ crew.crewId ] : selectedCrewForSMS,
      appOnly
    }
    this.post('Schedule/AddJobNotifiction', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (crew) {
            crew.notificationLoading = false;
          } else {
            this.notificationsLoader = false;
          }

          this.closeConfirmModal('cancel');

          if (res?.errors?.errorCode) return;

          GeneralService.showSuccessMessage('Successfully sent');
        }
      })
  }

  removeNotification(crew?: Crew) {
    if (this.notificationsLoader || crew?.notificationLoading) return;

    if (crew) {
      crew.notificationLoading = true;
    } else {
      this.notificationsLoader = true;
    }

    const data = {
      jobPartId: this.selectedSchedule.jobPartId,
      crewId: crew ? [ crew.crewId ] : this.crewList.filter(it => it.isCheckedForSMS).map(it => it.crewId)
    }

    this.delete('Schedule/DeleteNotificationByCrewIdandJobPartId', '', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (crew) {
            crew.notificationLoading = false;
          } else {
            this.notificationsLoader = false;
          }

          if (res?.errors?.errorCode) return;

          GeneralService.showSuccessMessage('Successfully deleted');
        }
      })
  }

  jobPartSelect() {
    this.updateNotClashingCounts(this.jobPartClashing);
  }

  selectAllClashing(): void {
    this.selectedTagFilterKeys.clear();
    const selectable = this.jobPartClashing?.filter(p => !p.isCrewLocked) ?? [];
    if (!selectable.length) {
      return;
    }
    if (selectable.every(p => p.checked)) {
      this.jobPartClashing?.forEach(part => {
        if (!part.isCrewLocked) {
          part.checked = false;
        }
      });
    } else {
      this.jobPartClashing?.forEach(part => {
        if (!part.isCrewLocked) {
          part.checked = true;
        }
      });
    }

    this.updateNotClashingCounts(this.jobPartClashing);
  }

  getCrewDetails(crew: JobPartCrew, popover: NgbPopover) {
    if (crew.detailsLoading) return;

    crew.detailsLoading = true;

    this.get<Array<ShiftCrewDetails>>(`Schedule/GetCrewDetailsForJobPartAsync/${ this.selectedSchedule.jobPartId }/${ crew.crewId }`)
      .subscribe({
        next: (res) => {
          crew.detailsLoading = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          this.shiftCrewDetails.set(this.markPossibleJPInsertion(res.data, this.selectedSchedule));
          popover.open();
        }
      })
  }

  markPossibleJPInsertion(scheduleList: ShiftCrewDetails[], jp: Schedule): ShiftCrewDetails[] {
    const jpStart = new Date(jp.startDate);
    const jpEnd = new Date(jp.endDate);

    const sortedList = [ ...scheduleList ].sort(
      (a, b) => new Date(a.jpStartDateTime).getTime() - new Date(b.jpStartDateTime).getTime()
    );

    return sortedList.map((item, index, list) => {
      const currentEnd = new Date(item.jpEndDateTime);
      const nextStart = index + 1 < list.length ? new Date(list[index + 1].jpStartDateTime) : null;

      const canFit =
        nextStart &&
        jpStart >= currentEnd &&
        jpEnd <= nextStart;

      return {
        ...item,
        highlight: canFit
      };
    });
  }

  isAllSelected(): boolean {
    const selectable = this.jobPartClashing?.filter(p => !p.isCrewLocked) ?? [];
    return selectable.length > 0 && selectable.every(p => p.checked);
  }

  isIndeterminate(): boolean {
    const selectable = this.jobPartClashing?.filter(p => !p.isCrewLocked) ?? [];
    return selectable.some(p => p.checked) && !this.isAllSelected();
  }

  getBadgeClass(crew: Crew, noSlotOnSelectedParts = false): string {
    if (noSlotOnSelectedParts) {
      return 'badge-danger';
    }

    if (crew.conflict > 0) {
      return 'badge-danger'
    }

    if (crew.holiday > 0) {
      return 'badge-light-danger'
    }

    if (crew.struckOut > 0) {
      return 'badge-dark'
    }

    if (crew.turnedDown > 0) {
      return 'badge-danger'
    }

    if (crew.recommended) {
      return 'badge-success'
    }

    return 'badge-primary';
  }

  openConfirmModal(value: any) {
    this.modalRef = this._modal.open(value, { centered: true })
  }

  closeConfirmModal(result: 'ok' | 'cancel') {
    if (result === 'ok') {
      this.sendNotification(null, false);
      return;
    }
    this.modalRef?.close();
  }

  resetFilters() {
    this.levels.forEach(level => level.checked = false);
    this.regions.forEach(region => region.checked = false);
  }
}
