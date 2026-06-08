import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { finalize } from 'rxjs';

import { ApiBase } from '../../../../shared/bases/api-base';
import { JobInvoiceEmailInfo, JobInvoiceEmailPart } from '../../../../shared/interface/jobs';
import { GeneralService } from '../../../../shared/services/general.service';

@Component({
  selector: 'app-job-invoice-email',
  imports: [ FormsModule, NgxEditorModule, CurrencyPipe ],
  providers: [ DatePipe, CurrencyPipe ],
  templateUrl: './job-invoice-email.component.html',
  styleUrl: './job-invoice-email.component.scss'
})
export class JobInvoiceEmailComponent extends ApiBase implements OnInit, OnDestroy {
  @Input({ required: true }) jobId!: number;
  @Output() closeModal = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  private readonly _dr = inject(DestroyRef);
  private readonly _date = inject(DatePipe);
  private readonly _currency = inject(CurrencyPipe);

  public editor!: Editor;
  readonly toolbar: Toolbar = [
    ['bold', 'italic'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
  ];

  loading = signal(true);
  companyName = '';
  venueName = '';
  recipientName = '';
  recipientEmail = '';
  ccEmail = '';
  amount = 0;
  invoiceStatusText = '';
  statusColour = '';
  emailBody = '';

  private invoiceInfo: JobInvoiceEmailInfo | null = null;

  constructor() {
    const http = inject(HttpClient);
    super(http);
  }

  ngOnInit(): void {
    this.editor = new Editor();
    this.loadInvoiceEmailInfo();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  onRecipientNameChange(name: string): void {
    this.recipientName = name;
    this.emailBody = this.updateSalutation(this.emailBody, name);
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onNext(): void {
    this.next.emit();
  }

  private loadInvoiceEmailInfo(): void {
    this.loading.set(true);

    this.get<JobInvoiceEmailInfo>('Jobs/GetJobInfoForInvoiceEmail', { jobId: this.jobId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const data = res.data;
          this.invoiceInfo = data;
          this.companyName = data.companyName ?? '';
          this.venueName = data.venueName ?? '';
          this.recipientName = data.contactFirstName ?? data.contactName ?? '';
          this.recipientEmail = data.emailAddress ?? '';
          this.ccEmail = data.emailAddress_CC ?? '';
          this.amount = data.amount ?? 0;
          this.invoiceStatusText = data.statusText ?? this.getPlainStatusText(data.emailBody);
          this.statusColour = data.statusColour ?? '';
          this.emailBody = this.buildEmailBody();
        }
      });
  }

  private buildEmailBody(): string {
    if (!this.invoiceInfo) {
      return '';
    }

    const jobParts = this.invoiceInfo.jobParts ?? [];
    const assignmentStart = this.getAssignmentStart(jobParts);
    const assignmentEnd = this.getAssignmentEnd(jobParts);
    const netCost = this._currency.transform(this.invoiceInfo.amount, 'GBP', 'symbol', '1.2-2') ?? '';
    const vatCost = this._currency.transform(this.invoiceInfo.vat, 'GBP', 'symbol', '1.2-2') ?? '';
    const totalCost = this._currency.transform(this.invoiceInfo.fullAmount, 'GBP', 'symbol', '1.2-2') ?? '';
    const vatPercent = this.invoiceInfo.amount > 0
      ? Math.round((this.invoiceInfo.vat / this.invoiceInfo.amount) * 100)
      : 20;
    const currentYear = new Date().getFullYear();

    return `
      <p align="right"><strong>INVOICE</strong><br>Our ref: ${ this.invoiceInfo.jobId }</p>
      <p>Dear ${ this.recipientName },</p>
      <p>
        Venue : <strong>${ this.venueName }</strong><br>
        Assignment start: ${ assignmentStart }<br>
        Assignment end: ${ assignmentEnd }
      </p>
      <p>Invoice for the above assignment is available. Please find the PDF document attached at the bottom of this email.</p>
      ${ this.buildJobPartsLists(jobParts) }
      <p align="right"><strong>Net cost: ${ netCost }</strong></p>
      <p align="right"><strong>Vat (${ vatPercent }%): ${ vatCost }</strong></p>
      <p align="right"><strong>Total Cost: ${ totalCost }</strong></p>
      <p align="right"><strong>Accounts 7 days overdue will be charged 8.5% APR.</strong><br><strong>Accounts 30 days overdue will be charged an additional £40 admin fee.</strong></p>
      <p align="right">© Copyright ${ currentYear } Alpha Crew Ltd. All rights reserved.<br>Alpha Crew Ltd is a trading name of Alpha Venue &amp; Event People Ltd, company registered in England and Wales. Company registration number 08236851.<br>VAT number: GB848340905.<br>Registered address: Peerglow Estate, Unit 3 Queensway, Ponders End, Enfield, London, EN3 4SB, UK.</p>
    `;
  }

  private buildJobPartsLists(jobParts: JobInvoiceEmailPart[]): string {
    const partRows = jobParts.map(part => {
      const date = this._date.transform(part.start_Date, 'dd MMM yyyy') ?? '';
      const time = this._date.transform(part.start_Date, 'HH:mm') ?? '';
      const cost = this._currency.transform(part.cost, 'GBP', 'symbol', '1.2-2') ?? '';

      return `
        <li>
          <p>${ date }</p>
          <p>${ time }</p>
          <p>${ part.hour }</p>
          <p>${ part.crew }</p>
          <p>${ cost }</p>
        </li>
      `;
    }).join('');

    return `
      <ul>
        <li>
          <p><strong>Date</strong></p>
          <p><strong>Time</strong></p>
          <p><strong>Hours</strong></p>
          <p><strong>Crew</strong></p>
          <p><strong>Cost</strong></p>
        </li>
        <li>
          <p><strong>${ this.venueName }</strong></p>
        </li>
        ${ partRows }
      </ul>
    `;
  }

  private getAssignmentStart(jobParts: JobInvoiceEmailPart[]): string {
    if (!jobParts.length) {
      return '';
    }

    const earliest = [...jobParts].sort(
      (a, b) => new Date(a.start_Date).getTime() - new Date(b.start_Date).getTime()
    )[0];

    return this._date.transform(earliest.start_Date, 'dd MMM yyyy HH:mm') ?? '';
  }

  private getAssignmentEnd(jobParts: JobInvoiceEmailPart[]): string {
    if (!jobParts.length) {
      return '';
    }

    const latestEnd = jobParts.reduce((maxEnd, part) => {
      const end = new Date(new Date(part.start_Date).getTime() + part.hour * 60 * 60 * 1000);
      return end > maxEnd ? end : maxEnd;
    }, new Date(0));

    return this._date.transform(latestEnd, 'dd MMM yyyy HH:mm') ?? '';
  }

  private getPlainStatusText(emailBody: string): string {
    const trimmed = emailBody?.trim() ?? '';
    return trimmed.includes('<') ? '' : trimmed;
  }

  private updateSalutation(body: string, name: string): string {
    const salutation = `<p>Dear ${ name },</p>`;
    const existingSalutation = /<p[^>]*>\s*Dear\s*[^<]*<\/p>/i;
    const invoiceBlock = /<p[^>]*>[\s\S]*?<strong>INVOICE<\/strong>[\s\S]*?<\/p>/i;

    if (existingSalutation.test(body)) {
      return body.replace(existingSalutation, salutation);
    }

    const match = body.match(invoiceBlock);

    if (match?.index !== undefined) {
      const insertAt = match.index + match[0].length;
      return body.slice(0, insertAt) + salutation + body.slice(insertAt);
    }

    return salutation + body;
  }
}
