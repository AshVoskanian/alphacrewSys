import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Editor, NgxEditorModule, toHTML, Toolbar } from 'ngx-editor';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { ApiBase } from '../../../../shared/bases/api-base';
import {
  JobInvoiceEmailInfo,
  JobInvoiceEmailPart,
  JobInvoiceEmailStatusInfo,
  SendInvoiceEmailRequest
} from '../../../../shared/interface/jobs';
import { GeneralService } from '../../../../shared/services/general.service';

@Component({
  selector: 'app-job-invoice-email',
  imports: [ FormsModule, NgxEditorModule, CurrencyPipe, DatePipe ],
  providers: [ DatePipe, CurrencyPipe ],
  templateUrl: './job-invoice-email.component.html',
  styleUrl: './job-invoice-email.component.scss'
})
export class JobInvoiceEmailComponent extends ApiBase implements OnInit, OnDestroy {
  @Input({ required: true }) jobId!: number;
  @Output() closeModal = new EventEmitter<void>();

  private readonly _dr = inject(DestroyRef);
  private readonly _date = inject(DatePipe);
  private readonly _currency = inject(CurrencyPipe);
  private readonly _generalService = inject(GeneralService);

  public editor!: Editor;
  readonly toolbar: Toolbar = [
    [ 'bold', 'italic' ],
    [ { heading: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ] } ],
    [ 'link', 'image' ],
    [ 'text_color', 'background_color' ],
  ];

  loading = signal(true);
  sending = signal(false);
  downloadingPdf = signal(false);
  isInvoiceSent = signal(false);
  sentInvoiceStatusText = '';
  companyName = '';
  venueName = '';
  recipientName = '';
  recipientEmail = '';
  ccEmail = '';
  invoiceDate: string | null = null;
  amount = 0;
  outstanding = 0;
  emailBody = '';

  private invoiceInfo: JobInvoiceEmailInfo | null = null;
  private syncingSalutation = false;

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
    if (this.isInvoiceSent() || this.syncingSalutation) {
      return;
    }

    this.recipientName = name;
    const currentBody = this.getCurrentEmailBody();
    const updatedBody = this.updateSalutation(currentBody, name);

    if (updatedBody === currentBody) {
      return;
    }

    this.syncingSalutation = true;
    this.emailBody = updatedBody;
    this.editor?.setContent(updatedBody);
    this.syncingSalutation = false;
  }

  onEmailBodyChange(body: string): void {
    if (this.isInvoiceSent()) {
      this.emailBody = body;
      return;
    }

    this.emailBody = body;

    if (this.syncingSalutation) {
      return;
    }

    const nameFromBody = this.extractSalutationName(body);

    if (nameFromBody !== null && nameFromBody !== this.recipientName) {
      this.syncingSalutation = true;
      this.recipientName = nameFromBody;
      this.syncingSalutation = false;
    }
  }

  onDownloadInvoicePdf(event: Event): void {
    event.preventDefault();

    if (this.downloadingPdf()) {
      return;
    }

    this.downloadingPdf.set(true);

    this.get<string>('Jobs/GetInvoicePdf', { jobId: this.jobId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.downloadingPdf.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const bytes = Uint8Array.from(atob(res.data), char => char.charCodeAt(0));
          const blob = new Blob([ bytes ], { type: 'application/pdf' });
          this._generalService.openBlobInNewTab(blob);
        },
        error: () => GeneralService.showErrorMessage('Failed to download invoice PDF')
      });
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onNext(): void {
    if (this.loading() || this.sending() || !this.recipientName.trim() || !this.recipientEmail.trim()) {
      return;
    }

    this.sending.set(true);

    const payload: SendInvoiceEmailRequest = {
      jobId: this.jobId,
      recipient: this.recipientName.trim(),
      emailTo: this.recipientEmail.trim(),
      emailCC: this.ccEmail.trim(),
      amount: this.amount,
      html: GeneralService.wrapEmailHtml(this.getHtmlForSend()),
      emailTopic: 'Invoice'
    };

    this.post<JobInvoiceEmailStatusInfo, SendInvoiceEmailRequest>('Jobs/SendInvoiceEmail', payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.sending.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.invoiceDate = new Date().toISOString();
          this.sentInvoiceStatusText = this.buildInvoiceSentStatusText(this.invoiceDate);
          this.isInvoiceSent.set(true);
          this.setEditorReadonly(true);
          GeneralService.showSuccessMessage('Invoice sent successfully');
        },
        error: () => GeneralService.showErrorMessage('Failed to send invoice email')
      });
  }

  private loadInvoiceEmailInfo(): void {
    this.loading.set(true);

    this.get<JobInvoiceEmailStatusInfo>('Jobs/InfoForInvoceEmail', {
      jobId: this.jobId,
      emailTopic: 'Invoice'
    })
      .pipe(
        switchMap(statusRes => {
          if (statusRes.errors?.errorCode) {
            GeneralService.showErrorMessage(statusRes.errors.message);
            return EMPTY;
          }

          const statusText = statusRes.data?.statusText?.trim() ?? '';
          this.sentInvoiceStatusText = statusText;
          this.isInvoiceSent.set(!!statusText);

          return this.get<JobInvoiceEmailInfo>('Jobs/GetJobInfoForInvoiceEmail', { jobId: this.jobId });
        }),
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
          this.invoiceDate = data.invoiceDate ?? null;
          this.amount = data.amount ?? 0;
          this.outstanding = data.outstanding ?? 0;
          this.emailBody = this.buildEmailBody();

          if (this.isInvoiceSent()) {
            this.setEditorReadonly(true);
          }

          this.editor?.setContent(this.emailBody);
        }
      });
  }

  private setEditorReadonly(readonly: boolean): void {
    this.editor?.view?.setProps({ editable: () => !readonly });
  }

  private buildInvoiceSentStatusText(date: string | Date | null): string {
    const formattedDate = this._date.transform(date, 'dd/MM/yyyy') ?? '';
    return `Invoice sent on ${ formattedDate }`;
  }

  private buildEmailBody(): string {
    if (!this.invoiceInfo) {
      return '';
    }

    const jobParts = this.invoiceInfo.jobParts ?? [];
    const assignmentStart = this.getAssignmentStart(jobParts);
    const assignmentEnd = this.getAssignmentEnd(jobParts);
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
      ${ this.buildJobPartsListForEditor(jobParts) }
      ${ this.buildCostSummaryLines() }
      <p class="invoice-footer-notice" style="margin-top: 1.5rem; margin-bottom: 0; line-height: 14px; text-align: right;" align="right"><strong>Accounts 7 days overdue will be charged 8.5% APR.</strong><br><strong>Accounts 30 days overdue will be charged an additional £40 admin fee.</strong></p>
      <p align="right">© Copyright ${ currentYear } Alpha Crew Ltd. All rights reserved.<br>Alpha Crew Ltd is a trading name of Alpha Venue &amp; Event People Ltd, company registered in England and Wales. Company registration number 08236851.<br>VAT number: GB848340905.<br>Registered address: Peerglow Estate, Unit 3 Queensway, Ponders End, Enfield, London, EN3 4SB, UK.</p>
    `;
  }

  private buildCostSummaryLines(): string {
    if (!this.invoiceInfo) {
      return '';
    }

    const vat = this.invoiceInfo.vat ?? 0;
    const discount = this.invoiceInfo.discount ?? 0;
    const paid = this.invoiceInfo.paid ?? 0;
    const fullAmount = this.invoiceInfo.totalCost ?? 0;
    const outstanding = this.invoiceInfo.outstanding ?? 0;

    const netCost = this._currency.transform(this.invoiceInfo.amount, 'GBP', 'symbol', '1.2-2') ?? '';
    const vatCost = this._currency.transform(vat, 'GBP', 'symbol', '1.2-2') ?? '';
    const totalCost = this._currency.transform(fullAmount, 'GBP', 'symbol', '1.2-2') ?? '';

    const lineStyle = 'margin: 0; line-height: 14px; text-align: right;';

    const lines = [
      `<strong>Net cost: ${ netCost }</strong>`,
      `<strong>Vat: ${ vatCost }</strong>`,
    ];

    if (discount > 0) {
      const discountCost = this._currency.transform(discount, 'GBP', 'symbol', '1.2-2') ?? '';
      lines.push(`<strong>Discount: ${ discountCost }</strong>`);
    }

    if (paid > 0) {
      const paidCost = this._currency.transform(paid, 'GBP', 'symbol', '1.2-2') ?? '';
      lines.push(`<strong>Paid: ${ paidCost }</strong>`);
    }

    lines.push(`<strong>Total Cost: ${ totalCost }</strong>`);

    if (outstanding !== fullAmount && outstanding > 0) {
      const outstandingCost = this._currency.transform(outstanding, 'GBP', 'symbol', '1.2-2') ?? '';
      lines.push(`<strong>Outstanding: ${ outstandingCost }</strong>`);
    }

    return `<div class="invoice-cost-summary" style="margin-top: 36px;">\n        <p class="invoice-cost-line" style="${ lineStyle }" align="right">${ lines.join('<br>') }</p>\n      </div>`;
  }

  private buildJobPartsListForEditor(jobParts: JobInvoiceEmailPart[]): string {
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
      <ul class="invoice-job-parts">
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

  private buildJobPartsTableForEmail(jobParts: JobInvoiceEmailPart[]): string {
    const cellStyle = 'padding: 4px; border: none;';
    const headerCellStyle = `${ cellStyle } font-weight: bold;`;
    const headerRowStyle = 'background-color: #d9d9d9;';

    const partRows = jobParts.map((part, index) => {
      const date = this._date.transform(part.start_Date, 'dd MMM yyyy') ?? '';
      const time = this._date.transform(part.start_Date, 'HH:mm') ?? '';
      const cost = this._currency.transform(part.cost, 'GBP', 'symbol', '1.2-2') ?? '';
      const rowStyle = `background-color: ${ index % 2 === 0 ? '#f2f2f2' : '#ffffff' };`;

      return `
        <tr style="${ rowStyle }">
          <td style="${ cellStyle }">${ date }</td>
          <td style="${ cellStyle }">${ time }</td>
          <td style="${ cellStyle }">${ part.hour }</td>
          <td style="${ cellStyle }">${ part.crew }</td>
          <td style="${ cellStyle } text-align: right;">${ cost }</td>
        </tr>
      `;
    }).join('');

    return `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 12px; line-height: 14px; color: #696969; font-family: Arial, Helvetica, sans-serif; width: 100%;">
        <tr style="${ headerRowStyle }">
          <td style="${ headerCellStyle }">Date</td>
          <td style="${ headerCellStyle }">Time</td>
          <td style="${ headerCellStyle }">Hours</td>
          <td style="${ headerCellStyle }">Crew</td>
          <td style="${ headerCellStyle } text-align: right;">Cost</td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <td colspan="5" style="${ cellStyle } font-weight: bold;">${ this.venueName }</td>
        </tr>
        ${ partRows }
      </table>
    `;
  }

  private getAssignmentStart(jobParts: JobInvoiceEmailPart[]): string {
    if (!jobParts.length) {
      return '';
    }

    const earliest = [ ...jobParts ].sort(
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

  private getCurrentEmailBody(): string {
    if (this.editor?.view) {
      return toHTML(this.editor.view.state.doc.toJSON(), this.editor.schema);
    }

    return typeof this.emailBody === 'string' ? this.emailBody : '';
  }

  private getHtmlForSend(): string {
    const body = this.getCurrentEmailBody();
    const jobParts = this.invoiceInfo?.jobParts ?? [];
    const tableHtml = this.buildJobPartsTableForEmail(jobParts);
    const listPattern = /<ul[^>]*class="invoice-job-parts"[^>]*>[\s\S]*?<\/ul>/i;

    if (listPattern.test(body)) {
      return body.replace(listPattern, tableHtml);
    }

    const tablePattern = /<table[\s\S]*?<\/table>/i;
    if (tablePattern.test(body)) {
      return body.replace(tablePattern, tableHtml);
    }

    const ulPattern = /<ul[^>]*>[\s\S]*?<\/ul>/i;
    if (ulPattern.test(body)) {
      return body.replace(ulPattern, tableHtml);
    }

    return body;
  }

  private updateSalutation(body: string, name: string): string {
    const normalizedBody = typeof body === 'string' ? body : '';
    const salutation = `<p>Dear ${ name },</p>`;
    const existingSalutation = /<p[^>]*>(?:(?!<\/p>)[\s\S])*?\bDear\b(?:(?!<\/p>)[\s\S])*?<\/p>/i;
    const invoiceBlock = /<p[^>]*>(?:(?!<\/p>)[\s\S])*?<strong>INVOICE<\/strong>(?:(?!<\/p>)[\s\S])*?<\/p>/i;

    if (existingSalutation.test(normalizedBody)) {
      return normalizedBody.replace(existingSalutation, salutation);
    }

    const match = normalizedBody.match(invoiceBlock);

    if (match?.index !== undefined) {
      const insertAt = match.index + match[0].length;
      return normalizedBody.slice(0, insertAt) + salutation + normalizedBody.slice(insertAt);
    }

    return salutation + normalizedBody;
  }

  private extractSalutationName(body: string): string | null {
    const normalizedBody = typeof body === 'string' ? body : '';
    const match = normalizedBody.match(
      /<p[^>]*>(?:(?!<\/p>)[\s\S])*?\bDear\s+((?:(?!<\/p>)[\s\S])*?)<\/p>/i
    );

    if (!match?.[1]) {
      return null;
    }

    return match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/,\s*$/, '')
      .trim();
  }
}
