import { DatePipe } from '@angular/common';
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
  selector: 'app-job-payment-received-email',
  imports: [ FormsModule, NgxEditorModule, DatePipe ],
  providers: [ DatePipe ],
  templateUrl: './job-payment-received-email.component.html',
  styleUrl: './job-payment-received-email.component.scss'
})
export class JobPaymentReceivedEmailComponent extends ApiBase implements OnInit, OnDestroy {
  @Input({ required: true }) jobId!: number;
  @Input() companyName = '';
  @Input() venueName = '';
  @Output() closeModal = new EventEmitter<void>();

  private readonly _dr = inject(DestroyRef);
  private readonly _date = inject(DatePipe);

  public editor!: Editor;
  readonly toolbar: Toolbar = [
    ['bold', 'italic'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
  ];

  loading = signal(true);
  sending = signal(false);
  isThanksSent = signal(false);
  sentThanksStatusText = '';
  recipientName = '';
  recipientEmail = '';
  ccEmail = '';
  sentDate: string | null = null;
  amount = 0;
  emailBody = '';

  private syncingSalutation = false;

  constructor() {
    const http = inject(HttpClient);
    super(http);
  }

  ngOnInit(): void {
    this.editor = new Editor();
    this.loadThanksEmailInfo();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  onRecipientNameChange(name: string): void {
    if (this.isThanksSent() || this.syncingSalutation) {
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
    if (this.isThanksSent()) {
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
      emailTopic: 'Thanks'
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
          this.sentThanksStatusText = this.buildThanksSentStatusText(this.sentDate);
          this.isThanksSent.set(true);
          this.setEditorReadonly(true);
          GeneralService.showSuccessMessage('Thanks email sent successfully');
        },
        error: () => GeneralService.showErrorMessage('Failed to send thanks email')
      });
  }

  private loadThanksEmailInfo(): void {
    this.loading.set(true);

    this.get<JobInvoiceEmailStatusInfo>('Jobs/InfoForInvoceEmail', {
      jobId: this.jobId,
      emailTopic: 'Thanks'
    })
      .pipe(
        switchMap(statusRes => {
          if (statusRes.errors?.errorCode) {
            GeneralService.showErrorMessage(statusRes.errors.message);
            return EMPTY;
          }

          const statusText = statusRes.data?.statusText?.trim() ?? '';
          this.sentThanksStatusText = statusText;
          this.isThanksSent.set(!!statusText);

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
          this.companyName = data.companyName ?? this.companyName;
          this.venueName = data.venueName ?? this.venueName;
          this.recipientName = data.contactFirstName ?? data.contactName ?? '';
          this.recipientEmail = data.emailAddress ?? '';
          this.ccEmail = data.emailAddress_CC ?? '';
          this.sentDate = data.invoiceDate ?? null;
          this.amount = data.amount ?? 0;
          this.emailBody = this.buildEmailBody();

          if (this.isThanksSent()) {
            this.setEditorReadonly(true);
          }

          this.editor?.setContent(this.emailBody);
        }
      });
  }

  private setEditorReadonly(readonly: boolean): void {
    this.editor?.view?.setProps({ editable: () => !readonly });
  }

  private buildThanksSentStatusText(date: string | Date | null): string {
    const formattedDate = this._date.transform(date, 'dd/MM/yyyy') ?? '';
    return `Thanks email sent on ${ formattedDate }`;
  }

  private buildEmailBody(): string {
    return `
      <p>Dear ${ this.recipientName },</p>
      <p>I just wanted to drop you a quick note to let you know that we have received your recent payment in respect of invoice ${ this.jobId }. Thank you very much. We really appreciate it.</p>
      <p>Kind regards,<br>Alphacrew Accounts</p>
    `;
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
