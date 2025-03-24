import { Component, inject, input } from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { Schedule } from "../../../../shared/interface/schedule";
import { NgxSpinnerModule } from "ngx-spinner";
import { DatePipe, NgStyle } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";
import { FeatherIconComponent } from "../../../../shared/components/ui/feather-icon/feather-icon.component";

@Component({
  selector: 'app-schedule-list',
  imports: [ CardComponent, NgxSpinnerModule, NgStyle, FeatherIconComponent ],
  providers: [DatePipe],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent {
  private _datePipe = inject(DatePipe);

  loading = input<boolean>(false);
  list = input<Array<Schedule>>([]);

  cardTitle(schedule: Schedule) {
    return `${this._datePipe.transform(schedule.startDate)}\u00A0 \u00A0${schedule.shiftNumber} of ${schedule.shiftCount}\u00A0 \u00A0 \u00A0${schedule.venueName}`
  }
}
