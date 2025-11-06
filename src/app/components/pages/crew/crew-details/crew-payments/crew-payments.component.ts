import { Component, DestroyRef, inject, input, OnChanges, signal, SimpleChanges, ViewChild } from '@angular/core';
import { ApiBase } from "../../../../../shared/bases/api-base";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ConfirmModalComponent } from "../../../../../shared/components/ui/confirm-modal/confirm-modal.component";
import { TextEditComponent } from "../text-edit/text-edit.component";
import { CrewDetail, CrewPayment } from "../../../../../shared/interface/crew";
import { CrewMainListActionData, CrewMainListItem, MainListComponent } from "../main-list/main-list.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { GeneralService } from "../../../../../shared/services/general.service";
import { CurrencyPipe } from "@angular/common";
import { PaymentAddUpdateComponent } from "./payment-add-update/payment-add-update.component";

@Component({
  selector: 'app-crew-payments',
  imports: [ MainListComponent, PaymentAddUpdateComponent, ConfirmModalComponent ],
  templateUrl: './crew-payments.component.html',
  styleUrl: './crew-payments.component.scss',
  providers: [ CurrencyPipe ]
})

export class CrewPaymentsComponent extends ApiBase implements OnChanges {
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);
  private readonly _currency = inject(CurrencyPipe);

  @ViewChild('confirmModal') confirmModal: ConfirmModalComponent;
  @ViewChild('addUpdatePayment') addUpdatePayment: TextEditComponent;

  crewDetail = input<CrewDetail>();

  loading = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  selectedListItem = signal<CrewPayment>(null);
  payments = signal<CrewMainListItem<CrewPayment>[]>([]);

  private addEditModalRef!: NgbModalRef;
  private confirmModalRef!: NgbModalRef;

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getPayments(this.crewDetail());
    }
  }

  getPayments(crewDetail: CrewDetail) {
    this.loading.set(true);

    const { crewId } = crewDetail;

    this.get<CrewPayment[]>('Crew/GetPayments', { crewId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message)
            return;
          }
          this.payments.set(
            res.data.map(it => ({
              title: this._currency.transform(it.payAmount, 'GBP', 'symbol', '1.2-2'),
              desc: it.comments,
              date: it.payDate,
              data: it,
              hasAction: true
            }))
          )
        }
      })
  }

  action(data: CrewMainListActionData) {
    this.selectedListItem.set(data.listItem.data);

    if (data.action === 'remove') {
      this.openConfirmModal();
    }
    if (data.action === 'edit') {
      this.openAddUpdateModal();
    }
  }

  openAddUpdateModal(add?: boolean) {
    if (add) {
      this.selectedListItem.set(null);
    }
    this.addEditModalRef = this._modal.open(this.addUpdatePayment, { centered: true, size: 'lg' });
  }

  openConfirmModal() {
    this.confirmModalRef = this._modal.open(this.confirmModal, { centered: true, size: 'md' })
  }

  closeConfirmModal(result: 'ok' | 'cancel') {
    if (result === 'ok') {
      this.removePayment(this.selectedListItem());
      return;
    }
    this.confirmModalRef?.close();
  }

  closeAddUpdateModal(data: { payDate: string, payAmount: number, comments: string }) {
    if (!data) {
      this.addEditModalRef?.close();
      return;
    }

    if (data) {
      this.addEditPayment(data);
    }
  }

  addEditPayment(paymentData: { payDate: string, payAmount: number, comments: string }) {
    if (this.modalLoading()) return;

    this.modalLoading.set(true);

    const { crewId } = this.crewDetail();
    const selected = this.selectedListItem();

    const data: CrewPayment = {
      crewPayId: selected ? selected.crewPayId : null,
      crewId,
      ...paymentData
    };

    GeneralService.clearObject(data);

    this.post<CrewPayment>('Crew/AddOrUpdatePayments', data)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.modalLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const updatedPayment = res.data;

          this.payments.update(list => {
            const exists = selected && list.some(it => it.data.crewPayId === updatedPayment.crewPayId);

            if (exists) {
              return list.map(item =>
                item.data.crewPayId === updatedPayment.crewPayId
                  ? {
                    title: this._currency.transform(updatedPayment.payAmount, 'GBP', 'symbol', '1.2-2'),
                    desc: updatedPayment.comments,
                    date: updatedPayment.payDate,
                    data: updatedPayment,
                    hasAction: true
                  }
                  : item
              );
            }

            const newItem = {
              title: this._currency.transform(updatedPayment.payAmount, 'GBP', 'symbol', '1.2-2'),
              desc: updatedPayment.comments,
              date: updatedPayment.payDate,
              data: updatedPayment,
              hasAction: true
            };

            return [ newItem, ...list ];
          });

          this.addEditModalRef?.close();
          GeneralService.showSuccessMessage();
        },
        error: () => this.modalLoading.set(false)
      });
  }

  removePayment(listItem: CrewPayment) {
    if (!listItem || this.modalLoading()) return;

    this.modalLoading.set(true);
    const { crewPayId } = listItem;

    this.get('Crew/RemovePayment', { crewPayId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.modalLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.payments.update(list =>
            list.filter(item => item.data.crewPayId !== this.selectedListItem().crewPayId)
          );
          this.confirmModalRef?.close();
          GeneralService.showSuccessMessage('The payment has been successfully deleted');
        }
      })
  }
}
