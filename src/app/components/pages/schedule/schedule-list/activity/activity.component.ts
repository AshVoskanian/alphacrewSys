import { Component, input, InputSignal, ViewEncapsulation } from '@angular/core';
import { JobPartLog } from "../../../../../shared/interface/activity";
import { DatePipe } from "@angular/common";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { StripBrPipe } from "../../../../../shared/pipes/strip-br.pipe";

@Component({
  selector: 'app-activity',
  imports: [ DatePipe, NgbTooltip, StripBrPipe ],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class ActivityComponent {
  activityList:InputSignal<JobPartLog[]> = input([]);
}
