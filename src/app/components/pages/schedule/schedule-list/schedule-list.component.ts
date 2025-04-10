import { Component, DestroyRef, inject, input, OnInit, signal, TemplateRef, WritableSignal } from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { Crew, CrewActionItem, JobPartCrew, JobPartCrewUpdate, Schedule } from "../../../../shared/interface/schedule";
import { NgxSpinnerModule } from "ngx-spinner";
import { DatePipe, NgStyle } from "@angular/common";
import { FeatherIconComponent } from "../../../../shared/components/ui/feather-icon/feather-icon.component";
import { UkCarNumComponent } from "../../../../shared/components/ui/uk-car-num/uk-car-num.component";
import {
  NgbAlertModule,
  NgbDropdownModule,
  NgbModal,
  NgbOffcanvas,
  NgbOffcanvasRef,
  NgbPopoverModule,
  NgbTooltipModule
} from "@ng-bootstrap/ng-bootstrap";
import { EditComponent } from "./edit/edit.component";
import { FormsModule } from "@angular/forms";
import { GeneralService } from "../../../../shared/services/general.service";
import { CrewListComponent } from "./crew-list/crew-list.component";
import { ApiBase } from "../../../../shared/bases/api-base";
import { CrewAction } from "../../../../shared/interface/enums/schedule";
import { ScheduleService } from "../schedule.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-schedule-list',
  imports: [ CardComponent, NgxSpinnerModule, NgStyle, FeatherIconComponent, NgbPopoverModule, NgbAlertModule,
    UkCarNumComponent, NgbTooltipModule, NgbDropdownModule, EditComponent, DatePipe, FormsModule ],
  providers: [ DatePipe ],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent extends ApiBase implements OnInit {
  private _dr = inject(DestroyRef);
  private _modal = inject(NgbModal);
  private _offCanvasService = inject(NgbOffcanvas);
  private _scheduleService = inject(ScheduleService);

  private offcanvasRef?: NgbOffcanvasRef;

  list = input<Array<Schedule>>([]);
  loading = input<boolean>(false);

  selectedSchedule: Schedule;

  crewList: WritableSignal<Array<Crew>> = signal<Array<Crew>>([]);

  menu: WritableSignal<Array<CrewActionItem>> = signal([
    {
      text: 'Send SMS',
      action: CrewAction.SEND_SMS,
      color: 'text-success',
      icon: 'fa-solid fa-comment f-18'
    },
    {
      id: 1,
      text: 'Assigned',
      action: CrewAction.ASSIGN,
      color: 'text-warning',
      icon: 'fas fa-square f-18',
      actionFn: this.updateStatusOrRole
    },
    {
      id: 5,
      text: 'Notified',
      action: CrewAction.NOTIFY,
      color: 'text-info',
      icon: 'fas fa-square f-18'
    },
    {
      id: 3,
      text: 'Reject',
      action: CrewAction.REJECT,
      color: 'text-danger',
      icon: 'fas fa-regular fa-square f-18'
    },
    {
      id: 2,
      text: 'Crew Chief',
      action: CrewAction.MARK_AS_CREW_CHIEF,
      color: 'text-success',
      icon: 'fa-regular fa-star f-16'
    },
    {
      id: 4,
      text: 'Team Leader',
      action: CrewAction.MARK_AS_TEAM_LEADER,
      color: 'text-success',
      icon: 'fa-solid fa-user-md f-18'
    },
    {
      id: 2,
      text: 'Confirmed',
      action: CrewAction.CONFIRM,
      color: 'text-success',
      icon: 'fas fa-square f-18'
    },
    {
      id: 2,
      text: 'Turned Down',
      action: CrewAction.TURN_DOWN,
      color: 'text-success',
      icon: 'far fa-thumbs-down f-18'
    },
    {
      id: 2,
      text: 'Remove',
      action: CrewAction.REMOVE,
      color: 'text-success',
      icon: 'fas fa-times f-18'
    },
    {
      id: 2,
      text: 'No Show',
      action: CrewAction.MARK_AS_NO_SHOW,
      color: 'text-success',
      icon: 'fa-solid fa-eye-slash f-16'
    },
    {
      id: 2,
      text: 'Change',
      action: CrewAction.CHANGE,
      color: 'text-success',
      icon: 'fa-solid fa-retweet f-18'
    }
  ]);


  crewNoteLoader: boolean = false;
  jobNoteLoader: boolean = false;

  ngOnInit() {
    this.getCrewList();
    this.checkIfCrewUpdate();
  }

  checkIfCrewUpdate() {
    this._scheduleService.crewUpdate$
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          if (res) {
            this.selectedSchedule.crews = this.selectedSchedule.crews.map(crew => {
              return this.fillCrewFromNewlyAddedCrew(
                this.selectedSchedule.crews,
                res
              )
            })

            console.log(this.fillCrewFromNewlyAddedCrew(
              this.selectedSchedule.crews,
              res
            ))
          }
        }
      })
  }

  fillCrewFromNewlyAddedCrew(crew: any, newlyAddedCrew: any): any {
    crew.jobPartCrewRoleId = newlyAddedCrew.jobPartCrewRoleId;
    crew.jobPartCrewStatusId = newlyAddedCrew.jobPartCrewStatusId;
    crew.jobPartCrewStatusColour = newlyAddedCrew.jobPartCrewStatusColour;
    crew.name = newlyAddedCrew.name ?? crew.name;
    crew.regionId = newlyAddedCrew.regionId ?? crew.regionId;
    crew.isActive = true;

    return crew;
  }

  openModal(value: TemplateRef<NgbModal>) {
    this._modal.open(value, { centered: true })
  }

  closeModal() {
    this._modal.dismissAll()
  }

  hoursDifference(startDateIso: string, endDateIso: string) {
    return GeneralService.calculateHoursDifference(startDateIso, endDateIso);
  }

  edit(schedule: Schedule, type: 'comment' | 'crewNote') {
    if (type === 'comment') {
      schedule.editComment = true;
    }

    if (type === 'crewNote') {
      schedule.editCrewNote = true;
    }
  }

  saveNote(schedule: Schedule, type: 'comment' | 'crewNote') {
    if (type === 'comment') {
      this.updatePartNote(schedule);
    }

    if (type === 'crewNote') {
      this.updateCrewNote(schedule);
    }
  }

  updatePartNote(schedule: Schedule) {
    if (this.jobNoteLoader) return;

    this.jobNoteLoader = true;

    const data = {
      jobPartId: schedule.jobPartId,
      notes: schedule.notes
    }

    this.post('Schedule/updatejobpartnotes', data).subscribe({
      next: (res) => {
        this.jobNoteLoader = false;

        if (res.errors?.errorCode) {

        } else {
          schedule.editComment = false;
          GeneralService.showSuccessMessage();
        }
      }
    })
  }

  updateCrewNote(schedule: Schedule) {
    if (this.crewNoteLoader) return;

    this.crewNoteLoader = true;

    const data = {
      jobPartId: schedule.jobPartId,
      notes: schedule.crewNotes
    }
    this.post('Schedule/updatejobpartcrewnotes', data).subscribe({
      next: (res) => {
        this.crewNoteLoader = false;

        if (res.errors?.errorCode) {

        } else {
          schedule.editCrewNote = false;
          GeneralService.showSuccessMessage();
        }
      }
    })
  }

  openCrewsPanel(crew?: JobPartCrew) {
    if ((crew && crew.isActive) || this.offcanvasRef) {
      return
    }

    this.offcanvasRef = this._offCanvasService.open(CrewListComponent, {
      scroll: false,
      backdrop: false,
      panelClass: 'common-offcanvas custom-off-canvas'
    });
    this.offcanvasRef.componentInstance.title = 'Crew';
    this.crewList().forEach(it => it.isChecked = false);
    this.offcanvasRef.componentInstance.crewList = this.crewList();

    this.offcanvasRef.result.finally(() => {
      this.offcanvasRef = undefined;
    });
  }

  getCrewList() {
    this.get<Array<Crew>>('Crew/GetCrewList', {}).subscribe({
      next: (res) => {
        this.crewList.set(res.data);
      }
    })
  }

  updateStatusOrRole(data: JobPartCrewUpdate, crew: JobPartCrew) {
    this.post<JobPartCrew>('Schedule/JobPartCrewStatusOrRoleUpdate', data)
      .subscribe({
        next: (res) => {
          if (crew) {
            crew.loading = false;
          }
          if (res.errors?.errorCode) {

          } else {
            const jobPartCrew: Array<JobPartCrew> = this.list().find(it => it.jobPartId === res.data.jobPartId)?.crews as Array<JobPartCrew>;
            const updatedCrew: JobPartCrew = jobPartCrew?.find(it => it.jobPartCrewId === res.data.jobPartCrewId) as JobPartCrew;
            updatedCrew.jobPartCrewRoleId = res.data.jobPartCrewRoleId;
            updatedCrew.jobPartCrewStatusId = res.data.jobPartCrewStatusId;
            updatedCrew.jobPartCrewStatusColour = res.data.jobPartCrewStatusColour;
            GeneralService.showSuccessMessage();
          }
        }
      })
  }

  removeCrew(crew: JobPartCrew) {
    const data = {
      jobPartId: this.selectedSchedule.jobPartId,
      crewId: crew.crewId
    }
    this.post<any>('Schedule/removeJobPartCrew', data)
      .subscribe({
        next: (res) => {
          if (crew) {
            crew.loading = false;
          }
          if (res.errors?.errorCode) {

          } else {
            this.selectedSchedule.crews = this.selectedSchedule.crews.map((crew, index) =>
              crew.jobPartCrewId === res.data
                ? {
                  ...crew,
                  isActive: false
                }
                : crew
            );

          }
        }
      })
  }


  menuAction(menu: CrewActionItem, crew: JobPartCrew) {
    if (crew.loading) {
      return;
    }

    const data: JobPartCrewUpdate = {
      jobPartCrewId: crew.jobPartCrewId,
      jobPartCrewRoleId: crew.jobPartCrewRoleId,
      jobPartCrewStatusid: crew.jobPartCrewStatusId
    }

    switch (menu.action) {
      case CrewAction.SEND_SMS:
        // TODO: handle SEND_SMS
        break;

      case CrewAction.ASSIGN:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.NOTIFY:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.REJECT:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.MARK_AS_CREW_CHIEF:
        crew.loading = true;
        data.jobPartCrewRoleId = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.MARK_AS_TEAM_LEADER:
        crew.loading = true;
        data.jobPartCrewRoleId = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.CONFIRM:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.TURN_DOWN:
        break;

      case CrewAction.REMOVE:
        crew.loading = true;
        this.removeCrew(crew);
        break;

      case CrewAction.MARK_AS_NO_SHOW:
        // TODO: handle MARK_AS_NO_SHOW
        break;

      case CrewAction.CHANGE:
        this.openCrewsPanel();
        break;

      default:
        console.warn('Unhandled action:', menu.action);
        break;
    }
  }

  selectSchedule(schedule: Schedule) {
    this.selectedSchedule = schedule;
    this._scheduleService.selectedShift$.next(this.selectedSchedule);
    console.log(9999, this.selectedSchedule)
  }
}
