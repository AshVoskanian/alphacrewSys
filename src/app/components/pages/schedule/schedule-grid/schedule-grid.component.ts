import { Component, inject, Input } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Schedule } from "../../../../shared/interface/schedule";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { GridItemComponent } from "./grid-item/grid-item.component";
import { NavService } from "../../../../shared/services/nav.service";

@Component({
  selector: 'app-schedule-grid',
  imports: [ CardComponent, CommonModule, GridItemComponent ],
  templateUrl: './schedule-grid.component.html',
  styleUrl: './schedule-grid.component.scss',
  standalone: true
})
export class ScheduleGridComponent {
  private _navService = inject(NavService);

  @Input() scheduleList: Array<Schedule> = [];
  @Input() loading: boolean = false;

  goToShift(schedule: Schedule) {
    this._navService.listView$.next('list');
    this._navService.scrollTo$.next(schedule);
  }
}
