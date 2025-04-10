import { Component, inject, Input, OnInit } from '@angular/core';
import { NgbActiveOffcanvas, NgbPopoverModule } from "@ng-bootstrap/ng-bootstrap";
import { Crew, JobPartCrew, Schedule } from "../../../../../shared/interface/schedule";
import { SvgIconComponent } from "../../../../../shared/components/ui/svg-icon/svg-icon.component";
import { CardComponent } from "../../../../../shared/components/ui/card/card.component";
import { CrewFilterPipe } from "../../../../../shared/pipes/crew-filter.pipe";
import { FormGroup, FormsModule } from "@angular/forms";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { ScheduleService } from "../../schedule.service";
import { GeneralService } from "../../../../../shared/services/general.service";

@Component({
  selector: 'app-crew-list',
  imports: [
    SvgIconComponent, CardComponent, CrewFilterPipe,
    FormsModule, NgbPopoverModule
  ],
  providers: [ CrewFilterPipe ],
  templateUrl: './crew-list.component.html',
  styleUrl: './crew-list.component.scss'
})
export class CrewListComponent extends ApiBase implements OnInit {
  private _filterPipe: CrewFilterPipe = inject(CrewFilterPipe);
  private _scheduleService = inject(ScheduleService);
  private _offcanvasService: NgbActiveOffcanvas = inject(NgbActiveOffcanvas);

  @Input() title: string;
  @Input() crewList: Array<Crew> = [];

  form: FormGroup;

  allAreSelected: boolean = false;
  showBtnOptions: boolean = false;
  selectedSchedule: Schedule | null;

  regions = [
    { id: 1, title: 'Lon', class: 'primary', checked: true },
    { id: 2, title: 'Birm', class: 'primary', checked: false },
    { id: 5, title: 'Manch', class: 'primary', checked: false },
    { id: 6, title: 'Brist', class: 'primary', checked: false },
    { id: 7, title: 'Scot', class: 'primary', checked: false },
    { id: 3, title: 'Nice', class: 'primary', checked: false },
    { id: 4, title: 'Par', class: 'primary', checked: false },
    { id: 8, title: 'Brc', class: 'primary', checked: false },
  ];

  levels = [
    { id: 5, title: 'PBC', class: 'warning', checked: true },
    { id: 1, title: 'L1', class: 'warning', checked: false },
    { id: 2, title: 'L2', class: 'warning', checked: false },
    { id: 3, title: 'L3', class: 'warning', checked: false },
    { id: 4, title: 'L4', class: 'warning', checked: false },
    { id: 1, title: 'CC2', class: 'warning', checked: false },
    { id: 24, title: 'CC1', class: 'warning', checked: false },
    { id: 15, title: 'SCC', class: 'warning', checked: false },
    { id: 18, title: 'S', class: 'warning', checked: false },
    { id: 20, title: 'SS', class: 'warning', checked: false },
    { id: 21, title: 'ES', class: 'warning', checked: false },
  ];

  ngOnInit() {
    this.getSelectedSchedule();
  }

  getSelectedSchedule(): void {
    this._scheduleService.selectedShift$.subscribe((schedule: Schedule | null) => {
      if (!schedule) return;

      this.selectedSchedule = schedule;

      const selectedCrewIds = new Set(schedule.crews.map(c => c.crewId));
      const selectedCrewRegionIds = new Set(schedule.crews.map(c => c.regionId));

      // Check existing crews
      this.crewList.forEach(crew => {
        crew.isChecked = selectedCrewIds.has(crew.crewId);
      });

      // Check existing crew level filters
      this.levels.forEach(level => {
      })

      // Check existing crew region filters
      this.regions.forEach(region => {
        region.checked = selectedCrewRegionIds.has(region.id);
      })
    });
  }

  closeOffcanvas() {
    this._offcanvasService.close()
  }

  getSelectedData(type: 'regions' | 'levels' | 'crew'): Array<number> {
    if (type === 'regions') {
      return this.regions.filter(it => it.checked).map(it => it.id);
    }

    if (type === 'levels') {
      return this.levels.filter(it => it.checked).map(it => it.id);
    }

    if (type === 'crew') {
      return this.crewList.filter(it => it.isChecked).map(it => it.crewId);
    }

    return [];
  }

  selectAll() {
    this.crewList.forEach(it => it.isChecked = this.allAreSelected);
  }

  areAllChecked(crew: Array<Crew>): boolean {
    return !crew.some(it => !it.isChecked);
  }

  crewSelect(crew: Crew) {
    crew.isChecked = !crew.isChecked;

    const transformedCrew = this._filterPipe.transform(
      this.crewList,
      this.getSelectedData('regions'),
      this.getSelectedData('levels')
    )
    this.allAreSelected = this.areAllChecked(transformedCrew);
  }

  saveCrew(type: 'current' | 'all') {
    this.showBtnOptions = false;

    if (type === 'current') {
      this.addCrewToShift();
    }

    if (type === 'all') {

    }
  }

  addCrewToShift() {
    const data = {
      jobPartId: this.selectedSchedule?.jobPartId,
      crewId: this.getSelectedData('crew')
    }
    this.post<Array<JobPartCrew>>('Schedule/updatejobpartcrew', data).subscribe({
      next: (res) => {
        if (res.errors?.errorCode) {

        } else {
          this._scheduleService.crewUpdate$.next(res.data);
          GeneralService.showSuccessMessage();
        }
      }
    })
  }
}
