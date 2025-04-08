import { Component, inject, input, OnInit, signal, TemplateRef, WritableSignal } from '@angular/core';
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
  NgbPopoverModule,
  NgbTooltipModule
} from "@ng-bootstrap/ng-bootstrap";
import { EditComponent } from "./edit/edit.component";
import { FormsModule } from "@angular/forms";
import { GeneralService } from "../../../../shared/services/general.service";
import { CrewListComponent } from "./crew-list/crew-list.component";
import { ApiBase } from "../../../../shared/bases/api-base";
import { CrewAction } from "../../../../shared/interface/enums/schedule";

@Component({
  selector: 'app-schedule-list',
  imports: [ CardComponent, NgxSpinnerModule, NgStyle, FeatherIconComponent, NgbPopoverModule, NgbAlertModule,
    UkCarNumComponent, NgbTooltipModule, NgbDropdownModule, EditComponent, DatePipe, FormsModule ],
  providers: [ DatePipe ],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent extends ApiBase implements OnInit {
  private _modal = inject(NgbModal);
  private _offCanvasService = inject(NgbOffcanvas)

  loading = input<boolean>(false);
  list = input<Array<Schedule>>([]);
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
  ])

  ngOnInit() {
    this.getCrewList();
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
      schedule.editComment = false;
    }

    if (type === 'crewNote') {
      schedule.editCrewNote = false;
    }
  }

  openCrewsPanel(crew?: JobPartCrew) {
    if (crew && crew.isActive) {
      return
    }
    const offcanvasRef = this._offCanvasService.open(CrewListComponent, {
      scroll: false,
      backdrop: false,
      panelClass: 'common-offcanvas custom-off-canvas'
    });
    offcanvasRef.componentInstance.title = 'Crew';
    this.crewList().forEach(it => it.isChecked = false);
    offcanvasRef.componentInstance.crewList = this.crewList();
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
        // TODO: handle REMOVE
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
}
