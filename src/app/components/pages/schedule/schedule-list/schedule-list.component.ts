import { Component, ElementRef, inject, input, signal, TemplateRef, ViewChild } from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { Schedule } from "../../../../shared/interface/schedule";
import { NgxSpinnerModule } from "ngx-spinner";
import { DatePipe, NgStyle } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";
import { FeatherIconComponent } from "../../../../shared/components/ui/feather-icon/feather-icon.component";
import { UkCarNumComponent } from "../../../../shared/components/ui/uk-car-num/uk-car-num.component";
import {
  NgbAlertModule,
  NgbDropdownModule,
  NgbModal,
  NgbPopoverModule,
  NgbTooltipModule
} from "@ng-bootstrap/ng-bootstrap";
import { EditComponent } from "./edit/edit.component";
import { FormsModule } from "@angular/forms";
import { GeneralService } from "../../../../shared/services/general.service";

@Component({
  selector: 'app-schedule-list',
  imports: [ CardComponent, NgxSpinnerModule, NgStyle, FeatherIconComponent, NgbPopoverModule, NgbAlertModule,
    UkCarNumComponent, NgbTooltipModule, NgbDropdownModule, EditComponent, DatePipe, FormsModule ],
  providers: [DatePipe],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent {
  private _datePipe = inject(DatePipe);

  loading = input<boolean>(false);
  list = input<Array<Schedule>>([]);


  menu = signal([
    {
      text: 'Send SMS',
      action: '',
      color: 'text-success',
      icon: 'fa-solid fa-comment f-18'
    },
    {
      text: 'Assigned',
      action: '',
      color: 'text-warning',
      icon: 'fas fa-square f-18'
    },
    {
      text: 'Notified',
      action: '',
      color: 'text-info',
      icon: 'fas fa-square f-18'
    },
    {
      text: 'Reject',
      action: '',
      color: 'text-danger',
      icon: 'fas fa-regular fa-square f-18'
    },
    {
      text: 'Crew Chief',
      action: '',
      color: 'text-success',
      icon: 'fa-regular fa-star f-16'
    },
    {
      text: 'Team Leader',
      action: '',
      color: 'text-success',
      icon: 'fa-solid fa-user-md f-18'
    },
    {
      text: 'Confirmed',
      action: '',
      color: 'text-success',
      icon: 'fas fa-square f-18'
    },
    {
      text: 'Turned Down',
      action: '',
      color: 'text-success',
      icon: 'far fa-thumbs-down f-18'
    },
    {
      text: 'Remove',
      action: '',
      color: 'text-success',
      icon: 'fas fa-times f-18'
    },
    {
      text: 'No Show',
      action: '',
      color: 'text-success',
      icon: 'fa-solid fa-eye-slash f-16'
    },
    {
      text: 'Change',
      action: '',
      color: 'text-success',
      icon: 'fa-solid fa-retweet f-18'
    }
  ])


  constructor(private modal: NgbModal){}

  openModal(value: TemplateRef<NgbModal>){
    this.modal.open(value, { centered: true })
  }

  closeModal(){
    this.modal.dismissAll()
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
}
