import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg, EventContentArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Select2Module, Select2UpdateEvent, Select2UpdateValue } from 'ng-select2-component';
import { finalize } from 'rxjs';
import { ApiBase } from '../../bases/api-base';
import {
  CalendarEventDay,
  CalendarEventsRequest,
} from '../../interface/schedule';
import { GeneralService } from '../../services/general.service';
import { RegionsService } from '../../services/regions.service';

@Component({
  selector: 'app-calendar-events',
  imports: [FullCalendarModule, Select2Module],
  templateUrl: './calendar-events.component.html',
  styleUrl: './calendar-events.component.scss',
})
export class CalendarEventsComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _regionsService = inject(RegionsService);

  /** Optional initial date (yyyy-MM-dd). Useful when opened from header/modal. */
  initialDate = input<string | null>(null);
  /** Optional initial region id. Defaults to All (0). */
  initialRegion = input<number>(0);
  /** Show date/region filters. Keep true for modal reuse unless host provides its own. */
  showFilters = input(true);

  @ViewChild('calendar') calendar?: FullCalendarComponent;

  loading = signal(false);
  regionId = signal(0);
  selectedDate = signal(this.toDateInputValue(new Date()));
  days = signal<CalendarEventDay[]>([]);

  regions = toSignal(this._regionsService.regions, { initialValue: [] });

  calendarEvents = computed<EventInput[]>(() =>
    this.days().map((day) => ({
      id: day.startDate,
      start: day.startDate.slice(0, 10),
      allDay: true,
      title: '',
      extendedProps: {
        jobs: day.jobs,
        hours: day.hours,
        oot: day.oot,
      },
    }))
  );

  readonly calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    buttonText: {
      today: 'Today',
    },
    height: 'auto',
    editable: false,
    selectable: false,
    displayEventTime: false,
    dayMaxEvents: false,
    datesSet: (arg) => this.onDatesSet(arg),
    eventContent: (arg) => this.renderEventContent(arg),
  };

  private lastRequestKey = '';
  private skipNextDatesSetLoad = false;

  ngOnInit(): void {
    const initialDate = this.initialDate();
    if (initialDate) {
      this.selectedDate.set(initialDate);
    }

    this.regionId.set(this.initialRegion() ?? 0);
    this.loadCalendarEvents();
  }

  onDateChange(value: string): void {
    if (!value || value === this.selectedDate()) {
      return;
    }

    this.selectedDate.set(value);
    this.skipNextDatesSetLoad = true;
    this.calendar?.getApi()?.gotoDate(value);
    this.loadCalendarEvents();
  }

  onRegionChange(event: Select2UpdateEvent<Select2UpdateValue>): void {
    const nextRegionId = +(event.value ?? 0);
    if (nextRegionId === this.regionId()) {
      return;
    }

    this.regionId.set(nextRegionId);
    this.loadCalendarEvents();
  }

  private onDatesSet(arg: DatesSetArg): void {
    const viewDate = this.toDateInputValue(arg.view.currentStart);

    if (this.skipNextDatesSetLoad) {
      this.skipNextDatesSetLoad = false;
      return;
    }

    const currentMonth = this.selectedDate().slice(0, 7);
    const viewMonth = viewDate.slice(0, 7);
    if (viewMonth === currentMonth) {
      return;
    }

    this.selectedDate.set(viewDate);
    this.loadCalendarEvents();
  }

  private loadCalendarEvents(): void {
    const date = this.selectedDate();
    if (!date) {
      return;
    }

    const region = this.regionId();
    const requestKey = `${date.slice(0, 7)}|${region}`;
    if (requestKey === this.lastRequestKey) {
      return;
    }

    this.lastRequestKey = requestKey;
    this.loading.set(true);

    const payload: CalendarEventsRequest = {
      date: `${date}T00:00:00.000Z`,
      region,
    };

    this.post<CalendarEventDay[]>('Schedule/CalendarEvents', payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.days.set(res.data ?? []);
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to load calendar events');
        },
      });
  }

  private renderEventContent(arg: EventContentArg): { html: string } {
    const jobs = arg.event.extendedProps['jobs'] ?? 0;
    const hours = arg.event.extendedProps['hours'] ?? 0;
    const oot = arg.event.extendedProps['oot'] ?? 0;

    return {
      html: `
        <div class="calendar-day-metrics">
          <div class="calendar-day-metric"><span>Jobs</span><strong>${jobs}</strong></div>
          <div class="calendar-day-metric"><span>Hours</span><strong>${hours}</strong></div>
          <div class="calendar-day-metric"><span>OOT</span><strong>${oot}</strong></div>
        </div>
      `,
    };
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
