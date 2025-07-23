import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Select2Module } from "ng-select2-component";
import { JobPartCrew, Schedule } from "../../../../../shared/interface/schedule";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { GeneralService } from "../../../../../shared/services/general.service";
import { DatePipe } from "@angular/common";
import { ClipboardModule } from "@angular/cdk/clipboard";

@Component({
  selector: 'app-send-sms-to-crew',
  imports: [
    Select2Module,
    ClipboardModule
  ],
  templateUrl: './send-sms-to-crew.component.html',
  styleUrl: './send-sms-to-crew.component.scss'
})
export class SendSmsToCrewComponent extends ApiBase implements OnInit {
  @Input() scheduleInfo: Schedule;
  @Input() selectedCrew: JobPartCrew;
  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  private _dr = inject(DestroyRef);
  private _date = inject(DatePipe);

  loading = false;

  text: string = `Job Notification:
{{date}}

{{crewCount}}CREW {{hourCount}}HR
Client: {{clientName}}
Venue: {{venueName}}

Please reply in App
  `;

  ngOnInit() {
    this.fillTemplate();
  }

  fillText(template: string, data: Record<string, string | number>): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => {
      const trimmedKey = key.trim();
      return data.hasOwnProperty(trimmedKey) ? String(data[trimmedKey]) : '';
    });
  }

  fillTemplate() {
    const values = {
      date: this._date.transform(this.scheduleInfo.startDate, 'EEE, dMMM, HH:mm'),
      crewCount: this.scheduleInfo.crewNumber,
      hourCount: this.hoursDifference(this.scheduleInfo.startDate, this.scheduleInfo.endDate),
      clientName: this.scheduleInfo.companyName,
      venueName: this.scheduleInfo.venueName
    };

    this.text = this.fillText(this.text, values);
  }

  hoursDifference(startDateIso: string, endDateIso: string) {
    return GeneralService.calculateHoursDifference(startDateIso, endDateIso);
  }

  sendSMS() {
    if (this.loading) return;

    this.loading = true;

    const data = {
      jobId: this.scheduleInfo.jobId,
      jobPartId: [ this.scheduleInfo.jobPartId ],
      crewId: [ this.selectedCrew.crewId ],
      message: this.text
    }
    this.post('Schedule/AddJobNotifiction', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          this.loading = false;

          if (res?.errors?.errorCode) return;

          GeneralService.showSuccessMessage('Successfully sent');
          this.closeModal.emit();
        }
      })
  }

  showSuccess() {
    GeneralService.showSuccessMessage('Copied to clipboard');
  }
}
