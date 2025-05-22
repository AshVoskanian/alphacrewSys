import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Schedule, ScheduleSmsInfo } from "../../../../../shared/interface/schedule";

@Component({
  selector: 'app-send-sms',
  imports: [],
  templateUrl: './send-sms.component.html',
  styleUrl: './send-sms.component.scss'
})
export class SendSmsComponent {
  @Input() scheduleInfo: Schedule;
  @Input()  smsInfo: Array<ScheduleSmsInfo> = [];

  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();
}
