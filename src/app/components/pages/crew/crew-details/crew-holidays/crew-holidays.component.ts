import {
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ApiBase } from "../../../../../shared/bases/api-base";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { TextEditComponent } from "../text-edit/text-edit.component";
import { ConfirmModalComponent } from "../../../../../shared/components/ui/confirm-modal/confirm-modal.component";
import { CrewDetail, CrewHoliday } from "../../../../../shared/interface/crew";
import { CrewMainListActionData, CrewMainListItem, MainListComponent } from "../main-list/main-list.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { GeneralService } from "../../../../../shared/services/general.service";
import { DatePipe } from "@angular/common";
import { HolidayAddUpdateComponent } from "./holiday-add-update/holiday-add-update.component";

@Component({
  selector: 'app-crew-holidays',
  imports: [ MainListComponent, ConfirmModalComponent, HolidayAddUpdateComponent ],
  templateUrl: './crew-holidays.component.html',
  styleUrl: './crew-holidays.component.scss',
  providers: [ DatePipe ]
})

export class CrewHolidaysComponent extends ApiBase implements OnChanges {
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);
  private readonly _date = inject(DatePipe);

  @ViewChild('confirmModal') confirmModal: ConfirmModalComponent;
  @ViewChild('addUpdateHoliday') addUpdateHoliday: TextEditComponent;

  crewDetail = input<CrewDetail>();

  loading = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  selectedListItem = signal<CrewHoliday>(null);
  holidaysList = signal<CrewMainListItem<CrewHoliday>[]>([]);

  private addEditModalRef!: NgbModalRef;
  private confirmModalRef!: NgbModalRef;

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getHolidays(this.crewDetail());
    }
  }

  getHolidays(crewDetail: CrewDetail) {
    this.loading.set(true);

    const { crewId } = crewDetail;

    this.get<CrewHoliday[]>('Crew/GetCrewHolidayByCrewId', { crewId })
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
          this.holidaysList.set(
            res.data.map(it => ({
              title: `${ this._date.transform(it.holidayStart) }  -  ${ this._date.transform(it.holidayEnd) }`,
              desc: it.comments,
              hasAction: true,
              data: it
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
    this.addEditModalRef = this._modal.open(this.addUpdateHoliday, { centered: true, size: 'lg' });
  }

  openConfirmModal() {
    this.confirmModalRef = this._modal.open(this.confirmModal, { centered: true, size: 'md' })
  }

  closeConfirmModal(result: 'ok' | 'cancel') {
    if (result === 'ok') {
      this.removeHoliday(this.selectedListItem());
      return;
    }
    this.confirmModalRef?.close();
  }

  closeAddUpdateModal(data: { startDate: string, endDate: string, comment: string }) {
    if (!data) {
      this.addEditModalRef?.close();
      return;
    }

    if (data) {
      this.addEditHoliday(data);
    }
  }

  addEditHoliday(holidayData: { startDate: string, endDate: string, comment: string }) {
    if (this.modalLoading()) return;

    this.modalLoading.set(true);

    const { crewId } = this.crewDetail();
    const selected = this.selectedListItem();

    const data: CrewHoliday = {
      crewHolidayId: selected ? selected.crewHolidayId : null,
      holidayStart: holidayData.startDate,
      holidayEnd: holidayData.endDate,
      comments: holidayData.comment,
      crewId
    };

    GeneralService.clearObject(data);

    this.post<CrewHoliday>('Crew/AddOrUpdateCrewHoliday', data)
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

          const updatedNote = res.data;

          this.holidaysList.update(list => {
            const exists = selected && list.some(it => it.data.crewHolidayId === updatedNote.crewHolidayId);

            if (exists) {
              // Edit case
              return list.map(item =>
                item.data.crewHolidayId === updatedNote.crewHolidayId
                  ? {
                    title: `${ this._date.transform(updatedNote.holidayStart) }  -  ${ this._date.transform(updatedNote.holidayEnd) }`,
                    desc: updatedNote.comments,
                    hasAction: true,
                    data: updatedNote
                  }
                  : item
              );
            }

            // Add case (new holiday)
            const newItem = {
              title: `${ this._date.transform(updatedNote.holidayStart) }  -  ${ this._date.transform(updatedNote.holidayEnd) }`,
              desc: updatedNote.comments,
              hasAction: true,
              data: updatedNote
            };

            return [ newItem, ...list ];
          });

          this.addEditModalRef?.close();
          GeneralService.showSuccessMessage();
        },
        error: () => this.modalLoading.set(false)
      });
  }

  removeHoliday(listItem: CrewHoliday) {
    if (!listItem || this.modalLoading()) return;

    this.modalLoading.set(true);
    const { crewHolidayId } = listItem;

    this.get('Crew/RemoveCrewHoliday', { crewHolidayId })
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

          this.holidaysList.update(list =>
            list.filter(item => item.data.crewHolidayId !== this.selectedListItem().crewHolidayId)
          );
          this.confirmModalRef?.close();
          GeneralService.showSuccessMessage('The holiday has been successfully deleted');
        }
      })
  }
}
