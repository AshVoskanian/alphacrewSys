import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GeneralService } from '../../../../shared/services/general.service';
import { ApiBase } from '../../../../shared/bases/api-base';
import { HttpClient } from '@angular/common/http';
import { PartialPayment } from '../../../../shared/interface/jobs';

@Component({
  selector: 'app-add-payment',
  standalone: true,
  imports: [ ReactiveFormsModule ],
  providers: [ DatePipe ],
  templateUrl: './add-payment.component.html',
  styleUrl: './add-payment.component.scss'
})
export class AddPaymentComponent extends ApiBase {
  jobId = input<number>();

  partialPaymentsAdded = output<PartialPayment[]>();

  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private readonly _datePipe = inject(DatePipe);

  paymentForm: FormGroup;
  loading = signal(false);

  constructor() {
    const http = inject(HttpClient);
    super(http);

    this.paymentForm = this._fb.group({
      paidDate: [ this._datePipe.transform(new Date(), 'yyyy-MM-dd'), [ Validators.required ] ],
      amount: [ null, [ Validators.required, Validators.min(0.01) ] ],
      comments: [ null ]
    });
  }

  submit() {
    if (this.loading() || this.paymentForm.invalid) return;

    const jobId = this.jobId();
    if (!jobId) return;

    const value = this.paymentForm.value;
    const paidDate = value.paidDate
      ? new Date(value.paidDate).toISOString()
      : null;

    this.loading.set(true);

    this.post<PartialPayment[]>('Jobs/AddPartialPayment', {
      partialPaymentId: 0,
      jobId,
      amount: Number(value.amount),
      paidDate,
      updatedBy: '',
      updatedDate: new Date().toISOString(),
      comments: value.comments || ''
    })
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

          GeneralService.showSuccessMessage('Payment added successfully');
          this.partialPaymentsAdded.emit(res.data ?? []);
        }
      });
  }
}
