import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Editor, NgxEditorModule, Toolbar, toHTML } from 'ngx-editor';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { ApiBase } from '../../../../shared/bases/api-base';
import { JobInvoiceEmailInfo, JobInvoiceEmailStatusInfo, SendInvoiceEmailRequest } from '../../../../shared/interface/jobs';
import { GeneralService } from '../../../../shared/services/general.service';

@Component({
  selector: 'app-job-final-chaseup-email',
  imports: [ FormsModule, NgxEditorModule, CurrencyPipe, DatePipe ],
  providers: [ DatePipe, CurrencyPipe ],
  templateUrl: './job-final-chaseup-email.component.html',
  styleUrl: './job-final-chaseup-email.component.scss'
})
export class JobFinalChaseupEmailComponent extends ApiBase implements OnInit, OnDestroy {
  @Input({ required: true }) jobId!: number;
  @Output() closeModal = new EventEmitter<void>();

  private readonly _dr = inject(DestroyRef);
  private readonly _date = inject(DatePipe);
  private readonly _currency = inject(CurrencyPipe);
  private readonly _generalService = inject(GeneralService);

  public editor!: Editor;
  readonly toolbar: Toolbar = [
    ['bold', 'italic'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
  ];

  loading = signal(true);
  sending = signal(false);
  downloadingPdf = signal(false);
  isFinalChaseupSent = signal(false);
  sentFinalChaseupStatusText = '';
  companyName = '';
  venueName = '';
  recipientName = '';
  recipientEmail = '';
  ccEmail = '';
  sentDate: string | null = null;
  amount = 0;
  outstanding = 0;
  emailBody = '';

  private finalChaseupInfo: JobInvoiceEmailInfo | null = null;
  private invoiceHistoryHtml = '';
  private syncingSalutation = false;

  constructor() {
    const http = inject(HttpClient);
    super(http);
  }

  ngOnInit(): void {
    this.editor = new Editor();
    this.loadFinalChaseupEmailInfo();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  onRecipientNameChange(name: string): void {
    if (this.isFinalChaseupSent() || this.syncingSalutation) {
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
    if (this.isFinalChaseupSent()) {
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
          const blob = new Blob([bytes], { type: 'application/pdf' });
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
      html: GeneralService.wrapEmailHtml(this.getCurrentEmailBody()),
      emailTopic: 'FinalChaseup'
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

          this.sentDate = new Date().toISOString();
          this.sentFinalChaseupStatusText = this.buildFinalChaseupSentStatusText(this.sentDate);
          this.isFinalChaseupSent.set(true);
          this.setEditorReadonly(true);
          GeneralService.showSuccessMessage('Final chaseup sent successfully');
        },
        error: () => GeneralService.showErrorMessage('Failed to send final chaseup email')
      });
  }

  private loadFinalChaseupEmailInfo(): void {
    this.loading.set(true);

    this.get<JobInvoiceEmailStatusInfo>('Jobs/InfoForInvoceEmail', {
      jobId: this.jobId,
      emailTopic: 'FinalChaseup'
    })
      .pipe(
        switchMap(statusRes => {
          if (statusRes.errors?.errorCode) {
            GeneralService.showErrorMessage(statusRes.errors.message);
            return EMPTY;
          }

          const statusText = statusRes.data?.statusText?.trim() ?? '';
          this.sentFinalChaseupStatusText = statusText;
          this.isFinalChaseupSent.set(!!statusText);
          this.invoiceHistoryHtml = statusRes.data?.html?.trim() ?? '';

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
          this.finalChaseupInfo = data;
          this.companyName = data.companyName ?? '';
          this.venueName = data.venueName ?? '';
          this.recipientName = data.contactFirstName ?? data.contactName ?? '';
          this.recipientEmail = data.emailAddress ?? '';
          this.ccEmail = data.emailAddress_CC ?? '';
          this.sentDate = data.invoiceDate ?? null;
          this.amount = data.amount ?? 0;
          this.outstanding = data.outstanding ?? 0;
          this.emailBody = this.buildEmailBody();

          if (this.isFinalChaseupSent()) {
            this.setEditorReadonly(true);
          }

          this.editor?.setContent(this.emailBody);
        }
      });
  }

  private setEditorReadonly(readonly: boolean): void {
    this.editor?.view?.setProps({ editable: () => !readonly });
  }

  private buildFinalChaseupSentStatusText(date: string | Date | null): string {
    const formattedDate = this._date.transform(date, 'dd/MM/yyyy') ?? '';
    return `Final chaseup sent on ${ formattedDate }`;
  }

  private buildEmailBody(): string {
    if (!this.finalChaseupInfo) {
      return '';
    }

    const formattedAmount = this._currency.transform(this.outstanding, 'GBP', 'symbol', '1.2-2') ?? '';
    const dueDate = this._date.transform(this.finalChaseupInfo.paymentDate, 'd MMMM yyyy') ?? '';
    const daysOverdue = this.getDaysOverdue(this.finalChaseupInfo.paymentDate);

    return `
      <p>Dear ${ this.recipientName },</p>
      <p>According to our records invoice ${ this.jobId } for ${ formattedAmount } is now seriously overdue.</p>
      <p>This invoice was due on ${ dueDate } and is now ${ daysOverdue } days overdue. This invoice must be paid immediately to avoid further action.</p>
      <p>If you've paid, please advise us of the payment details. Please pay within term days agreed upon.<br>All remittance advice slips are to be sent to accounts@alphacrew.co.uk.</p>
      <p><strong>ACCOUNTS 7 DAYS OVERDUE WILL BE CHARGED 8.5% APR.</strong><br><strong>ACCOUNTS 30 DAYS OVERDUE WILL BE CHARGED AN ADDITIONAL £40 ADMIN FEE</strong></p>
    ` + this.buildInvoiceHistoryBlock();
  }

  private buildInvoiceHistoryBlock(): string {
    if (!this.invoiceHistoryHtml) {
      return '';
    }

    const formattedDate = this._date.transform(this.sentDate, 'd MMMM yyyy HH:mm:ss') ?? '';

    return GeneralService.buildEmailHistoryQuote(this.invoiceHistoryHtml, formattedDate);
  }

  private getDaysOverdue(paymentDate: string): number {
    const due = new Date(paymentDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - due.getTime();

    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  private getCurrentEmailBody(): string {
    if (this.editor?.view) {
      return toHTML(this.editor.view.state.doc.toJSON(), this.editor.schema);
    }

    return typeof this.emailBody === 'string' ? this.emailBody : '';
  }

  private updateSalutation(body: string, name: string): string {
    const normalizedBody = typeof body === 'string' ? body : '';
    const salutation = `<p>Dear ${ name },</p>`;
    const existingSalutation = /<p[^>]*>(?:(?!<\/p>)[\s\S])*?\bDear\b(?:(?!<\/p>)[\s\S])*?<\/p>/i;

    if (existingSalutation.test(normalizedBody)) {
      return normalizedBody.replace(existingSalutation, salutation);
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
