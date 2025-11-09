import { Component, DestroyRef, inject, input, OnChanges, signal, SimpleChanges, ViewChild } from '@angular/core';
import { ApiBase } from "../../../../../shared/bases/api-base";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { CurrencyPipe } from "@angular/common";
import { ConfirmModalComponent } from "../../../../../shared/components/ui/confirm-modal/confirm-modal.component";
import { TextEditComponent } from "../text-edit/text-edit.component";
import { CrewAdjustment, CrewDetail } from "../../../../../shared/interface/crew";
import { CrewMainListActionData, CrewMainListItem, MainListComponent } from "../main-list/main-list.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { GeneralService } from "../../../../../shared/services/general.service";
import { DeductionAddUpdateComponent } from "./deduction-add-update/deduction-add-update.component";

@Component({
  selector: 'app-crew-deductions',
  imports: [ MainListComponent, ConfirmModalComponent, DeductionAddUpdateComponent ],
  templateUrl: './crew-deductions.component.html',
  styleUrl: './crew-deductions.component.scss',
  providers: [ CurrencyPipe ]
})

export class CrewDeductionsComponent extends ApiBase implements OnChanges {
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);
  private readonly _currency = inject(CurrencyPipe);

  @ViewChild('confirmModal') confirmModal: ConfirmModalComponent;
  @ViewChild('addUpdateDeduction') addUpdateDeduction: TextEditComponent;

  crewDetail = input<CrewDetail>();

  loading = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  selectedListItem = signal<CrewAdjustment>(null);
  deductions = signal<CrewMainListItem<CrewAdjustment>[]>([]);

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

    this.get<CrewAdjustment[]>('Crew/GetCrewDeductions', { crewId })
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
          this.deductions.set(
            res.data.map(it => ({
              title: this._currency.transform(it.amount, 'GBP', 'symbol', '1.2-2'),
              desc: it.description,
              date: it.adjustmentDate,
              dateDesc: it.enteredBy,
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
    this.addEditModalRef = this._modal.open(this.addUpdateDeduction, { centered: true, size: 'lg' });
  }

  openConfirmModal() {
    this.confirmModalRef = this._modal.open(this.confirmModal, { centered: true, size: 'md' })
  }

  closeConfirmModal(result: 'ok' | 'cancel') {
    if (result === 'ok') {
      this.removeDeduction(this.selectedListItem());
      return;
    }
    this.confirmModalRef?.close();
  }

  closeAddUpdateModal(data: { adjustmentDate: string, amount: number, description: string }) {
    if (!data) {
      this.addEditModalRef?.close();
      return;
    }

    if (data) {
      this.addEditPayment(data);
    }
  }

  addEditPayment(paymentData: { adjustmentDate: string, amount: number, description: string }) {
    if (this.modalLoading()) return;

    this.modalLoading.set(true);

    const { crewId } = this.crewDetail();
    const selected = this.selectedListItem();

    const data: CrewAdjustment = {
      adjustmentId: selected ? selected.adjustmentId : null,
      crewId,
      ...paymentData
    };

    GeneralService.clearObject(data);

    this.post<CrewAdjustment>('Crew/AddOrUpdateCrewDeduction', data)
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

          const updatedDeduction = res.data;

          this.deductions.update(list => {
            const exists = selected && list.some(it => it.data.adjustmentId === updatedDeduction.adjustmentId);

            if (exists) {
              return list.map(item =>
                item.data.adjustmentId === updatedDeduction.adjustmentId
                  ? {
                    title: this._currency.transform(updatedDeduction.amount, 'GBP', 'symbol', '1.2-2'),
                    desc: updatedDeduction.description,
                    date: updatedDeduction.adjustmentDate,
                    dateDesc: updatedDeduction.enteredBy,
                    data: updatedDeduction,
                    hasAction: true
                  }
                  : item
              );
            }

            const newItem = {
              title: this._currency.transform(updatedDeduction.amount, 'GBP', 'symbol', '1.2-2'),
              desc: updatedDeduction.description,
              date: updatedDeduction.adjustmentDate,
              dateDesc: updatedDeduction.enteredBy,
              data: updatedDeduction,
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

  removeDeduction(listItem: CrewAdjustment) {
    if (!listItem || this.modalLoading()) return;

    this.modalLoading.set(true);
    const { adjustmentId } = listItem;

    this.get('Crew/RemoveCrewDeduction', { payAdjustmentId: adjustmentId })
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

          this.deductions.update(list =>
            list.filter(item => item.data.adjustmentId !== this.selectedListItem().adjustmentId)
          );
          this.confirmModalRef?.close();
          GeneralService.showSuccessMessage('The deduction has been successfully deleted');
        }
      })
  }
}
