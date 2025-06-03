import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Schedule, ScheduleSmsInfo } from "../../../../../shared/interface/schedule";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { GeneralService } from "../../../../../shared/services/general.service";
import { ApiBase } from "../../../../../shared/bases/api-base";

@Component({
  selector: 'app-send-sms',
  imports: [ NgbTooltip, FormsModule, ClipboardModule ],
  templateUrl: './send-sms.component.html',
  styleUrl: './send-sms.component.scss'
})
export class SendSmsComponent extends ApiBase implements OnInit {
  @Input() scheduleInfo: Schedule;
  @Input() smsInfo: Array<ScheduleSmsInfo> = [];

  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  checkboxList: any = [];
  loading: boolean = false;
  selectedId: number | null = null;
  text: string = `Here is the breakdown of your crew. We kindly request you to review the information provided and reach out to our office immediately if any discrepancies are detected.

CLIENT: {{companyName}}
VENUE: {{venueName}}

{{schedules}}

Thank You,
Alpha Crew
`;

  ngOnInit() {
    this.fillCheckboxes();
    this.text = this.generateMessage(this.smsInfo);
  }

  generateMessage(data: Array<ScheduleSmsInfo>): string {
    const schedulesText = this.smsInfo.map((s: any) => {
      let block = `${ s.startDay } ${ s.startDate } ${ s.startMonth }, ${ s.startYear } ${ s.startTime } - ${ s.endTime }`;
      if (s.vehicles?.trim()) block += `\nVehicles: ${ s.vehicles }`;
      if (s.crewChiefs?.trim()) block += `\nCrew Chief: ${ s.crewChiefs }`;
      if (s.teamLead?.trim()) block += `\nTeam Lead: ${ s.teamLead }`;
      if (s.crew?.trim()) block += `\nCrew: ${ s.crew }`;
      return block;
    }).join('\n\n');

    return this.text
      .replace('{{companyName}}', data[0].companyName || 'N/A')
      .replace('{{venueName}}', data[0].jobPartVenueName || data[0].venueName || 'N/A')
      .replace('{{schedules}}', schedulesText);
  }

  fillCheckboxes() {
    const match = this.scheduleInfo.onsiteContact?.match(/(?:(?:\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3})/);

    const onsiteContact = match ? match[0].replace(/\s+/g, '') : '';

    this.checkboxList = [
      {
        id: 1,
        value: '',
        title: 'Venue contact 1',
        checked: false,
      },
      {
        id: 2,
        value: '',
        title: 'Venue contact 2',
        checked: false,
      },
      {
        id: 3,
        value: onsiteContact,
        title: `On-site contact`,
        checked: false,
      }
    ]

    this.selectedId = this.checkboxList.find(it => it.value)?.id || null;
  }

  showSuccess() {
    GeneralService.showSuccessMessage('Copied to clipboard');
  }

  getSelectedContact() {
    return this.checkboxList.find(it => it.id === this.selectedId)?.value;
  }
  sendSMS() {
    if (this.loading) return;

    this.loading = true;
    const data = {
      text: this.text,
      address: this.getSelectedContact(),
      jobId: this.scheduleInfo.jobId,
      jobPartId: this.scheduleInfo.jobPartId
    };

    this.post('Schedule/AddClientCommnication', data)
      .subscribe({
        next: (res => {
          this.loading = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage('SMS sent successfully');
          this.closeModal.emit();
        })
      })
  }
}
