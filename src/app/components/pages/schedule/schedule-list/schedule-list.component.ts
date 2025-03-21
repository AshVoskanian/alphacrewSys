import { Component, input } from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { Schedule } from "../../../../shared/interface/schedule";
import { NgxSpinnerModule } from "ngx-spinner";

@Component({
  selector: 'app-schedule-list',
  imports: [ CardComponent, NgxSpinnerModule ],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent {
  loading = input<boolean>(false);
  list = input<Array<Schedule>>([]);
}
