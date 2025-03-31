import { Component, inject, input, TemplateRef } from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { Schedule } from "../../../../shared/interface/schedule";
import { NgxSpinnerModule } from "ngx-spinner";
import { DatePipe, NgStyle } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";
import { FeatherIconComponent } from "../../../../shared/components/ui/feather-icon/feather-icon.component";
import { UkCarNumComponent } from "../../../../shared/components/ui/uk-car-num/uk-car-num.component";
import { NgbDropdownModule, NgbModal, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { EditComponent } from "./edit/edit.component";
import { FormsModule } from "@angular/forms";
import { GeneralService } from "../../../../shared/services/general.service";

@Component({
  selector: 'app-schedule-list',
  imports: [ CardComponent, NgxSpinnerModule, NgStyle, FeatherIconComponent,
    UkCarNumComponent, NgbTooltipModule, NgbDropdownModule, EditComponent, DatePipe, FormsModule ],
  providers: [DatePipe],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent {
  private _datePipe = inject(DatePipe);

  loading = input<boolean>(false);
  list = input<Array<Schedule>>([]);


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
}
