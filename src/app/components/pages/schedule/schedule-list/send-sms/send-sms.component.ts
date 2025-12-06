import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Schedule, ScheduleSmsInfo } from "../../../../../shared/interface/schedule";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { GeneralService } from "../../../../../shared/services/general.service";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { PhoneInputDirective } from "../../../../../shared/directives/phone-input.directive";
import { ToastrService } from "ngx-toastr";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { PHONE_COUNTRY_RULES } from "../../../../../shared/utils/date";

@Component({
  selector: 'app-send-sms',
  imports: [ NgbTooltip, FormsModule, ClipboardModule, PhoneInputDirective ],
  templateUrl: './send-sms.component.html',
  styleUrl: './send-sms.component.scss'
})
export class SendSmsComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _toast = inject(ToastrService);

  @Input() scheduleInfo: Schedule;
  @Input() smsInfo: Array<ScheduleSmsInfo> = [];

  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  loading: boolean = false;
  phoneValid: boolean = true;
  onSiteContact: string = '';
  text: string = `Here is the breakdown of your crew. We kindly request you to review the information provided and reach out to our office immediately if any discrepancies are detected.

CLIENT: {{companyName}}
VENUE: {{venueName}}

{{schedules}}

Thank You,
Alpha Crew
`;

  ngOnInit() {
    this.setOnsiteContact();
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

  private extractAllPhoneNumbers(text: string): string {
    if (!text) return '';

    const normalizedText = text.replace(/[()\s-]/g, '');

    const combinedRegex = new RegExp(
      PHONE_COUNTRY_RULES.map(rule => rule.regex.source.replace(/^\^|\$$/g, '')).join('|'),
      'g'
    );

    const matches = normalizedText.match(combinedRegex) || [];

    const uniqueValues = Array.from(new Set(
      matches.map(m => m.replace(/[^+\d]/g, ''))
    ));

    return uniqueValues.join(';');
  }


  setOnsiteContact(): void {
    this.onSiteContact = this.extractAllPhoneNumbers(this.scheduleInfo.onsiteContact || '');
  }

  getCombinedPhoneNumbers(): string {
    if (!this.onSiteContact) return '';

    const uniqueValues = Array.from(
      new Set(
        this.onSiteContact
          .split(';')
          .map(v => v.trim())
          .filter(Boolean)
      )
    );

    return uniqueValues.join(';');
  }


  showSuccess() {
    GeneralService.showSuccessMessage('Copied to clipboard');
  }

  sendSMS() {
    if (this.loading) return;

    this.loading = true;
    const data = {
      text: this.text,
      address: this.getCombinedPhoneNumbers(),
      jobId: this.scheduleInfo.jobId,
      jobPartId: this.scheduleInfo.jobPartId
    };

    this.post('Schedule/AddClientCommnication', data)
      .pipe(takeUntilDestroyed(this._dr), finalize(() => this.loading = false))
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

  validatePastedPhone() {
    this._toast.error('Invalid phone number format');
  }
}
