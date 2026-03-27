import { Component, input, InputSignal } from '@angular/core';
import { JobPartLog } from "../../../../../shared/interface/activity";
import { DatePipe } from "@angular/common";
import { CardComponent } from "../../../../../shared/components/ui/card/card.component";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { StripBrPipe } from "../../../../../shared/pipes/strip-br.pipe";

@Component({
  selector: 'app-activity',
  imports: [ DatePipe, CardComponent, NgbTooltip, StripBrPipe],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss'
})

export class ActivityComponent {
  activityList:InputSignal<JobPartLog[]> = input([]);
}
