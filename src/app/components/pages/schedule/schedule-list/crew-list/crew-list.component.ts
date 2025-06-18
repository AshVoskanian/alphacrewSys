import { ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit, signal, WritableSignal } from '@angular/core';
import {
  NgbActiveOffcanvas,
  NgbDropdownModule,
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
import { SvgIconComponent } from "../../../../../shared/components/ui/svg-icon/svg-icon.component";
import { CardComponent } from "../../../../../shared/components/ui/card/card.component";
import { CrewFilterPipe } from "../../../../../shared/pipes/crew-filter.pipe";
import { FormGroup, FormsModule } from "@angular/forms";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { ScheduleService } from "../../schedule.service";
import { GeneralService } from "../../../../../shared/services/general.service";
import { AsyncPipe, DatePipe, NgClass, NgStyle } from "@angular/common";
import { finalize, Observable } from "rxjs";
import { FeatherIconComponent } from "../../../../../shared/components/ui/feather-icon/feather-icon.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FilterPipe } from "../../../../../shared/pipes/filter.pipe";

@Component({
  selector: 'app-crew-list',
  imports: [
    SvgIconComponent, CardComponent, CrewFilterPipe, DatePipe, AsyncPipe, FilterPipe, NgClass,
    FormsModule, NgbPopoverModule, NgbTooltipModule, NgbDropdownModule, FeatherIconComponent, NgStyle
  ],
  providers: [ CrewFilterPipe ],
  templateUrl: './crew-list.component.html',
  styleUrl: './crew-list.component.scss'
})
export class CrewListComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _filterPipe: CrewFilterPipe = inject(CrewFilterPipe);
  private _scheduleService = inject(ScheduleService);
  private _offcanvasService: NgbActiveOffcanvas = inject(NgbActiveOffcanvas);

  @Input() title: string;
  crewList: Array<Crew> = [];
  isJobScoped: boolean = false;

  form: FormGroup;

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

  ngOnInit() {
    this.getSelectedSchedule();
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

        const selectedCrewIds = new Set(schedule.crews.map(c => c.crewId));
        const selectedCrewRegionIds = new Set(schedule.crews.map(c => c.regionId));
        const selectedCrewLevelIds = new Set(schedule.crews.map(c => c.levelCrewingWeighting));

        // Check existing crews
        this.crewList.forEach(crew => {
          crew.isChecked = selectedCrewIds.has(crew.crewId);
        });

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

        if (!this.regions.some(it => it.checked)) {
          this.regions[0].checked = true;
        }

        this.getCrewManager();
        // this.getCrewClashing();
      });
  }

  closeOffcanvas() {
    this._offcanvasService.close()
  }

  getSelectedData(type: 'regions' | 'levels' | 'crew' | 'jobParts'): Array<number> {
    if (type === 'regions') {
      return this.regions.filter(it => it.checked).map(it => it.id);
    }

    if (type === 'levels') {
      return this.levels.filter(it => it.checked).map(it => it.id);
    }

    if (type === 'crew') {
      return this.crewList.filter(it => it.isChecked).map(it => it.crewId);
    }

    if (type === 'jobParts') {
      return this.jobPartClashing.filter(it => it.checked).map(it => it.jobPartId);
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

  selectAllForSMS() {
    this.crewList.forEach(it => it.isCheckedForSMS = this.allAreSelectedForSMS);
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

  saveCrew(type: 'current' | 'all') {
    this.showBtnOptions = false;

    this.addCrewToShift(type);
  }

  addCrewToShift(type: 'current' | 'all') {
    if (this.loading) return;
    this.loading = true;

    const data = {
      jobId: this.selectedSchedule.jobId,
      jobPartId: this.selectedSchedule?.jobPartId,
      crewId: this.getSelectedData('crew')
    }

    if (type === 'current') {
      delete data.jobId
    }

    this.post<Array<Schedule>>('Schedule/updatejobpartcrew', data).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.errors?.errorCode) {

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
            const match = res.data.find(r => r.crewID === crew.crewId);
            if (match) {
              crew.crewHours = match.crewHours;
              crew.conflict = match.conflict;
              crew.holiday = match.holiday;
              crew.struckOut = match.struckOut;
              crew.turnedDown = match.turnedDown;
              crew.cssColour = match.cssColour;
              crew.notificationStatusId = match.notificationStatusId;
              crew.notificationStatusText = match.notificationStatusText;
            }
          }
        }
      })
  }

  getCrewClashing(): void {
    this.crewClashingLoader = true;

    this.get<Array<JobPartClashing>>(`Crew/GetCrewClashing/${ this.selectedSchedule.jobPartId }`)
      .pipe(finalize(() => this.crewClashingLoader = false))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) return;

          this.jobPartClashing = res.data ?? [];

          const selected = this.jobPartClashing.find(it => it.jobPartId === this.selectedSchedule.jobPartId);

          if (selected?.startDate) {
            const selectedDate = new Date(selected.startDate);

            this.jobPartClashing = this.jobPartClashing.filter(it => new Date(it.startDate) >= selectedDate);

            this.jobPartClashing.forEach(it => it.checked = it.jobPartId === this.selectedSchedule.jobPartId);
          }

          this.updateNotClashingCounts(this.jobPartClashing);
        }
      });
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
        .filter(jp => jp.checked)
        .forEach(jp => {
          if (crew.notClashingInfo?.details?.[jp.jobPartId] > 0) {
            crew.jobPartIds.push(jp.jobPartId);
          }
        });
    });
    this._cdr.detectChanges();
  }


  sendNotification(crew?: Crew) {
    if (this.notificationsLoader || crew?.notificationLoading) return;

    if (crew) {
      crew.notificationLoading = true;
    } else {
      this.notificationsLoader = true;
    }

    const data = {
      jobId: this.selectedSchedule.jobId,
      jobPartId: this.selectedSchedule.jobPartId,
      crewId: crew ? [ crew.crewId ] : this.crewList.filter(it => it.isCheckedForSMS).map(it => it.crewId)
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
      crewId: crew ? [ crew.crewId ] : this.crewList.filter(it => it.isChecked).map(it => it.crewId)
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
    if (this.isAllSelected()) {
      this.jobPartClashing?.forEach(part => part.checked = false);
    } else {
      this.jobPartClashing?.forEach(part => part.checked = true);
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
          this.shiftCrewDetails.set(res.data);
          popover.open();
        }
      })
  }

  isAllSelected(): boolean {
    return this.jobPartClashing?.length > 0 && this.jobPartClashing.every(p => p.checked);
  }

  isIndeterminate(): boolean {
    return this.jobPartClashing?.some(p => p.checked) && !this.isAllSelected();
  }

  getBadgeClass(crew: Crew): string {
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

    return 'badge-primary';
  }
}
