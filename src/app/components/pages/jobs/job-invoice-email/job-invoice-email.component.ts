import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

import { Job } from '../../../../shared/interface/jobs';

@Component({
  selector: 'app-job-invoice-email',
  imports: [ FormsModule, NgxEditorModule, CurrencyPipe ],
  providers: [ DatePipe, CurrencyPipe ],
  templateUrl: './job-invoice-email.component.html',
  styleUrl: './job-invoice-email.component.scss'
})
export class JobInvoiceEmailComponent implements OnInit, OnDestroy {
  @Input({ required: true }) job!: Job;
  @Output() closeModal = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  private _date = inject(DatePipe);
  private _currency = inject(CurrencyPipe);

  public editor!: Editor;
  readonly toolbar: Toolbar = [
    ['bold', 'italic'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
  ];
  recipientName = 'Accounts';
  recipientEmail = '';
  ccEmail = '';
  emailBody = '';

  ngOnInit(): void {
    this.editor = new Editor();
    this.recipientEmail = '';
    this.emailBody = this.buildEmailBody();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onNext(): void {
    this.next.emit();
  }

  private buildEmailBody(): string {
    const startDate = this._date.transform(this.job.starts, 'dd MMM yyyy HH:mm') ?? '';
    const endDate = this._date.transform(this.job.ends, 'dd MMM yyyy HH:mm') ?? '';
    const cost = this._currency.transform(this.job.cost, 'GBP', 'symbol', '1.2-2') ?? '';

    return `
      <p style="text-align: right;"><strong>INVOICE</strong><br>Our ref: ${ this.job.jobId }</p>
      <p>Dear ${ this.recipientName },</p>
      <p>
        Venue: ${ this.job.venueName }<br>
        Assignment start: ${ startDate }<br>
        Assignment end: ${ endDate }
      </p>
      <p>Please find attached your invoice. A PDF copy is also attached to this email.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 6px 8px; text-align: left;">Date</th>
            <th style="padding: 6px 8px; text-align: left;">Time</th>
            <th style="padding: 6px 8px; text-align: left;">Hours</th>
            <th style="padding: 6px 8px; text-align: left;">Crew</th>
            <th style="padding: 6px 8px; text-align: right;">Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px;">${ this._date.transform(this.job.starts, 'dd MMM yyyy') ?? '' }</td>
            <td style="padding: 6px 8px;">${ this._date.transform(this.job.starts, 'HH:mm') ?? '' }</td>
            <td style="padding: 6px 8px;">${ this.job.totalHours }</td>
            <td style="padding: 6px 8px;">${ this.job.parts }</td>
            <td style="padding: 6px 8px; text-align: right;">${ cost }</td>
          </tr>
        </tbody>
      </table>
      <p style="text-align: right; margin-top: 1rem;">
        <strong>Total Cost: ${ cost }</strong>
      </p>
      <p style="font-size: 0.85em; color: #666; margin-top: 1.5rem;">
        Interest may be charged on overdue accounts in accordance with our terms.
      </p>
    `;
  }
}
