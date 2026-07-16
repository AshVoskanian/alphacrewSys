import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnChanges,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TextEditComponent } from '../text-edit/text-edit.component';
import { ConfirmModalComponent } from '../../../../../shared/components/ui/confirm-modal/confirm-modal.component';
import { CrewDetail, CrewHoliday } from '../../../../../shared/interface/crew';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GeneralService } from '../../../../../shared/services/general.service';
import { HolidayAddUpdateComponent } from './holiday-add-update/holiday-add-update.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-crew-holidays',
  imports: [ FullCalendarModule, ConfirmModalComponent, HolidayAddUpdateComponent ],
  templateUrl: './crew-holidays.component.html',
  styleUrl: './crew-holidays.component.scss'
})
export class CrewHolidaysComponent extends ApiBase implements OnChanges {
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);

  @ViewChild('confirmModal') confirmModal: ConfirmModalComponent;
  @ViewChild('addUpdateHoliday') addUpdateHoliday: TextEditComponent;

  crewDetail = input<CrewDetail>();

  loading = signal(false);
  modalLoading = signal(false);
  selectedListItem = signal<CrewHoliday | null>(null);
  holidays = signal<CrewHoliday[]>([]);

  readonly calendarEvents = computed<EventInput[]>(() =>
    this.holidays().map(holiday => this.toCalendarEvent(holiday))
  );

  readonly calendarOptions: CalendarOptions = {
    plugins: [ dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin ],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      list: 'List'
    },
    height: 'auto',
    editable: false,
    selectable: false,
    dayMaxEvents: true,
    displayEventTime: false,
    eventClick: this.handleEventClick.bind(this),
    eventDidMount: this.handleEventDidMount.bind(this)
  };

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
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.holidays.set(res.data ?? []);
        }
      });
  }

  openAddUpdateModal(add?: boolean) {
    if (add) {
      this.selectedListItem.set(null);
    }
    this.addEditModalRef = this._modal.open(this.addUpdateHoliday, { centered: true, size: 'lg' });
  }

  openConfirmModal() {
    this.confirmModalRef = this._modal.open(this.confirmModal, { centered: true, size: 'md' });
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

    this.addEditHoliday(data);
  }

  addEditHoliday(holidayData: { startDate: string, endDate: string, comment: string }) {
    if (this.modalLoading()) {
      return;
    }

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

          const updatedHoliday = res.data;

          this.holidays.update(list => {
            const exists = selected && list.some(it => it.crewHolidayId === updatedHoliday.crewHolidayId);

            if (exists) {
              return list.map(item =>
                item.crewHolidayId === updatedHoliday.crewHolidayId ? updatedHoliday : item
              );
            }

            return [ updatedHoliday, ...list ];
          });

          this.addEditModalRef?.close();
          GeneralService.showSuccessMessage();
        },
        error: () => this.modalLoading.set(false)
      });
  }

  removeHoliday(listItem: CrewHoliday | null) {
    if (!listItem || this.modalLoading()) {
      return;
    }

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

          this.holidays.update(list =>
            list.filter(item => item.crewHolidayId !== listItem.crewHolidayId)
          );
          this.confirmModalRef?.close();
          GeneralService.showSuccessMessage('The holiday has been successfully deleted');
        }
      });
  }

  private handleEventClick(clickInfo: EventClickArg): void {
    const holiday = clickInfo.event.extendedProps?.['holiday'] as CrewHoliday | undefined;

    if (!holiday) {
      return;
    }

    this.selectedListItem.set(holiday);
    this.openAddUpdateModal();
  }

  private handleEventDidMount(mountInfo: EventMountArg): void {
    const holiday = mountInfo.event.extendedProps?.['holiday'] as CrewHoliday | undefined;

    if (!holiday) {
      return;
    }

    const actions = document.createElement('span');
    actions.className = 'crew-holiday-event-actions';

    const editBtn = document.createElement('i');
    editBtn.className = 'fa-solid fa-pen crew-holiday-event-action';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      this.selectedListItem.set(holiday);
      this.openAddUpdateModal();
    });

    const removeBtn = document.createElement('i');
    removeBtn.className = 'fa-solid fa-xmark crew-holiday-event-action';
    removeBtn.title = 'Delete';
    removeBtn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      this.selectedListItem.set(holiday);
      this.openConfirmModal();
    });

    actions.append(editBtn, removeBtn);
    mountInfo.el.appendChild(actions);
  }

  private toCalendarEvent(holiday: CrewHoliday): EventInput {
    return {
      id: String(holiday.crewHolidayId ?? `${ holiday.holidayStart }-${ holiday.holidayEnd }`),
      title: holiday.comments?.trim() || 'Holiday',
      start: this.toDateOnly(holiday.holidayStart),
      end: this.toExclusiveEndDate(holiday.holidayEnd),
      allDay: true,
      extendedProps: { holiday }
    };
  }

  private toDateOnly(value: string): string {
    return value?.includes('T') ? value.split('T')[0] : value;
  }

  /** FullCalendar all-day `end` is exclusive; backend holidayEnd is inclusive. */
  private toExclusiveEndDate(inclusiveEnd: string): string {
    const dateOnly = this.toDateOnly(inclusiveEnd);
    const [ year, month, day ] = dateOnly.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    date.setUTCDate(date.getUTCDate() + 1);

    return date.toISOString().slice(0, 10);
  }
}
