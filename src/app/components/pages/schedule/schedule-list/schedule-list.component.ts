import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  input,
  OnInit,
  Output,
  QueryList,
  signal,
  TemplateRef,
  ViewChild,
  ViewChildren,
  WritableSignal
} from '@angular/core';
import {
  Crew,
  CrewActionItem,
  CrewDetailForShift,
  JobMessageStatus,
  JobPartCrew,
  JobPartCrewAdditionalDetail,
  JobPartCrewEdit,
  JobPartCrewUpdate,
  Notification,
  Schedule,
  ScheduleSmsInfo,
  Statistics,
  Vehicle
} from "../../../../shared/interface/schedule";
import { NgxSpinnerModule } from "ngx-spinner";
import { DatePipe, NgClass, NgStyle, TitleCasePipe } from "@angular/common";
import { FeatherIconComponent } from "../../../../shared/components/ui/feather-icon/feather-icon.component";
import { UkCarNumComponent } from "../../../../shared/components/ui/uk-car-num/uk-car-num.component";
import {
  NgbAlertModule,
  NgbDropdownModule,
  NgbModal,
  NgbOffcanvas,
  NgbOffcanvasRef,
  NgbPopover,
  NgbPopoverModule,
  NgbTooltipModule
} from "@ng-bootstrap/ng-bootstrap";
import { EditComponent } from "./edit/edit.component";
import { FormsModule } from "@angular/forms";
import { GeneralService } from "../../../../shared/services/general.service";
import { CrewListComponent } from "./crew-list/crew-list.component";
import { ApiBase } from "../../../../shared/bases/api-base";
import { CrewAction } from "../../../../shared/enums/schedule";
import { ScheduleService } from "../schedule.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { VehiclesComponent } from "./vehicles/vehicles.component";
import { SendSmsComponent } from "./send-sms/send-sms.component";
import { FilterPipe } from "../../../../shared/pipes/filter.pipe";
import { forkJoin, switchMap, take, timer } from "rxjs";
import { NavService } from "../../../../shared/services/nav.service";
import { UpdatesNotesComponent } from "./updates-notes/updates-notes.component";
import { SendSmsToCrewComponent } from "./send-sms-to-crew/send-sms-to-crew.component";
import { UkPostcodeLinkPipe } from "../../../../shared/pipes/uk-post-code-link.pipe";

@Component({
  selector: 'app-schedule-list',
  imports: [ NgxSpinnerModule, NgStyle, FeatherIconComponent, UpdatesNotesComponent,
    NgbPopoverModule, NgbAlertModule, VehiclesComponent, DatePipe, FilterPipe, TitleCasePipe, NgClass, UkPostcodeLinkPipe,
    UkCarNumComponent, NgbTooltipModule, NgbDropdownModule, EditComponent, DatePipe, FormsModule, SendSmsComponent, SendSmsToCrewComponent ],
  providers: [ DatePipe ],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent extends ApiBase implements OnInit, AfterViewInit {
  private _dr = inject(DestroyRef);
  private _modal = inject(NgbModal);
  private _navService = inject(NavService);
  private _offCanvasService = inject(NgbOffcanvas);
  private _scheduleService = inject(ScheduleService);

  @ViewChild('editModal') editModal: any;
  @ViewChild('vehicleModal') vehicleModal: any;
  @ViewChild('sendSmsModal') sendSmsModal: SendSmsComponent;
  @ViewChild('updateNotes') updateNotes: UpdatesNotesComponent;
  @ViewChild('shiftCrewDetailsRef') shiftCrewDetailsRef: any;
  @ViewChildren('itemBlock') itemBlocks!: QueryList<ElementRef>;
  @ViewChild('sendSmsToCrewModal') sendSmsToCrewModal: SendSmsToCrewComponent;

  private offcanvasRef?: NgbOffcanvasRef;

  @Input() list: Array<Schedule> = [];
  @Input() isJobScoped: boolean = false;
  @Output() openJobsShifts: EventEmitter<Schedule> = new EventEmitter<Schedule>();

  loading = input<boolean>(false);
  jobShiftsLoading = input<boolean>(false);

  selectedCrew: JobPartCrew
  selectedSchedule: Schedule;

  crewInfo: WritableSignal<JobPartCrewEdit> = signal(null);
  statics: WritableSignal<Array<Statistics>> = signal([]);
  vehiclesInfo: WritableSignal<Array<Vehicle>> = signal([]);
  shiftCrewDetails: WritableSignal<Array<CrewDetailForShift>> = signal([]);
  crewList: WritableSignal<Array<Crew>> = signal<Array<Crew>>([]);
  menu: WritableSignal<Array<CrewActionItem>> = signal([
    {
      text: 'Send SMS',
      action: CrewAction.SEND_SMS,
      color: 'text-success',
      icon: 'fa-solid fa-comment f-18'
    },
    {
      id: 1,
      text: 'Assigned',
      action: CrewAction.ASSIGN,
      color: 'text-warning',
      icon: 'fas fa-square f-18',
    },
    {
      id: 5,
      text: 'Notified',
      action: CrewAction.NOTIFY,
      color: 'text-info',
      icon: 'fas fa-square f-18'
    },
    {
      id: 3,
      text: 'Reject',
      action: CrewAction.REJECT,
      color: 'text-danger',
      icon: 'fas fa-regular fa-square f-18'
    },
    {
      id: 2,
      text: 'Crew Chief',
      action: CrewAction.MARK_AS_CREW_CHIEF,
      color: 'text-success',
      icon: 'fa-regular fa-star f-16'
    },
    {
      id: 4,
      text: 'Team Leader',
      action: CrewAction.MARK_AS_TEAM_LEADER,
      color: 'text-success',
      icon: 'fa-solid fa-user-md f-18'
    },
    {
      id: 2,
      text: 'Confirmed',
      action: CrewAction.CONFIRM,
      color: 'text-success',
      icon: 'fas fa-square f-18'
    },
    {
      id: 3,
      text: 'Turned Down',
      action: CrewAction.TURN_DOWN,
      color: 'text-success',
      icon: 'far fa-thumbs-down f-18'
    },
    {
      id: 2,
      text: 'Remove',
      action: CrewAction.REMOVE,
      color: 'text-success',
      icon: 'fas fa-times f-18'
    },
    {
      id: 6,
      text: 'No Show',
      action: CrewAction.MARK_AS_NO_SHOW,
      color: 'text-success',
      icon: 'fa-solid fa-eye-slash f-14'
    },
    {
      id: 2,
      text: 'Profile',
      action: CrewAction.PROFILE,
      color: 'text-dark',
      icon: 'fa-solid fa-user f-16',
      href: `https://alphacrew.eu/Crew/Edit/`
    }
  ]);
  smsInfo: WritableSignal<Array<ScheduleSmsInfo>> = signal([]);

  hideVehicles: boolean = false;

  colorsConfig = {
    2: 'light',
    14: 'dark',
    3: 'dark',
    7: 'dark'
  }

  ngOnInit() {
    this.getCrewList();
    this.checkIfCrewUpdate();
    this.getInfo();
    this.getStatistics();
    this.getInfoMultiple();
    this.getJobPartCrewAdditionalDetails();
  }

  ngAfterViewInit() {
    this.subToGridElementClick();
  }

  subToGridElementClick() {
    this._navService.scrollTo$
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: schedule => {
          if (schedule) {
            this.scrollToItem(schedule.jobPartId)
          }
        }
      })
  }

  checkIfCrewUpdate() {
    this._scheduleService.crewUpdate$
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res: Schedule[] | null) => {
          if (res && res.length !== 0) {
            res.forEach(it => {
              this._scheduleService.shifts = this._scheduleService.shifts.map(item => {
                if (item.jobPartId === it.jobPartId) {
                  return {
                    ...it,
                    crews: this.fillArray(it.crews, it.crewNumber)
                  };
                }
                return item;
              });

              this._scheduleService.jobScopedShifts = this._scheduleService.jobScopedShifts.map(item => {
                if (item.jobPartId === it.jobPartId) {
                  return {
                    ...it,
                    crews: this.fillArray(it.crews, it.crewNumber)
                  };
                }
                return item;
              });
            });

            const params = {
              date: GeneralService.convertToDate(this._navService.date$.value),
              days: this._navService.days,
              regionFilter: this._navService.regionId,
              jobId: this.isJobScoped ? this.selectedSchedule?.jobId : null,
            };

            if (!params.jobId) {
              delete params.jobId;
            }

            this.post<Array<JobMessageStatus>>('Schedule/GetJobPartCrewAdditionalDetailsSms', params)
              .pipe(takeUntilDestroyed(this._dr))
              .subscribe(res => {
                this.updateSchedulesWithStatuses(res.data);
              });

            this.post<Array<JobPartCrewAdditionalDetail>>('Schedule/GetJobPartCrewAdditionalDetails', params)
              .pipe(takeUntilDestroyed(this._dr))
              .subscribe(res => {
                this.updateSchedulesWithCrewChanges(res.data);
              });
            this._scheduleService.crewUpdate$.next(null);
          }
        }
      });
  }

  fillArray(arr: Array<JobPartCrew>, length: number): Array<JobPartCrew> {
    const filled: Array<JobPartCrew> = [];

    for (let i = 0; i < length; i++) {
      if (i < arr.length) {
        filled.push({ ...arr[i], isActive: true });
      } else {
        filled.push({
          name: '',
          crewId: undefined,
          isActive: false
        });
      }
    }

    return filled;
  }

  openEditModal(value: TemplateRef<NgbModal>) {
    this._modal.open(value, { centered: true, size: 'xl' })
  }

  hoursDifference(startDateIso: string, endDateIso: string) {
    return GeneralService.calculateHoursDifference(startDateIso, endDateIso);
  }

  edit(schedule: Schedule, type: 'job_note' | 'crew_note') {
    this.selectedSchedule = schedule;
    schedule.noteType = type;
    this._modal.open(this.updateNotes, { centered: true, size: 'xl' });
  }

  openCrewsPanel(crew: JobPartCrew, e: Event, schedule: Schedule) {
    if (schedule.updateLoading) return;

    if (schedule) {
      this.selectSchedule(schedule);
    }
    e?.stopPropagation();

    if ((crew && crew.isActive) || this.offcanvasRef) {
      return
    }

    this.offcanvasRef = this._offCanvasService.open(CrewListComponent, {
      scroll: false,
      backdrop: true,
      container: null,
      panelClass: 'common-offcanvas custom-off-canvas'
    });
    this.crewList().forEach(it => {
      it.isChecked = false;
      it.jobPartIds = []
    });
    this.offcanvasRef.componentInstance.crewList = this.crewList();
    this.offcanvasRef.componentInstance.isJobScoped = this.isJobScoped;

    this.offcanvasRef.result.finally(() => {
      this.offcanvasRef = undefined;
    });
  }

  getCrewList() {
    if (this.crewList()?.length !== 0) return;
    this._scheduleService.crewListLoading.next(true);

    this.get<Array<Crew>>('Crew/GetCrewList', {})
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this._scheduleService.crewListLoading.next(false);
          this.crewList.set(res.data);
          if (this.offcanvasRef) {
            this.offcanvasRef.componentInstance.crewList = this.crewList();
          }
        }
      })
  }

  getCrewInfo(crew: JobPartCrew) {
    crew.editLoading = true;

    this.get<JobPartCrewEdit>('schedule/getjobpartcrewforedit', { jobPartCrewId: crew.jobPartCrewId })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          crew.editLoading = false;
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
          } else {
            this.crewInfo.set(res.data);
            this.openEditModal(this.editModal);
          }
        }
      })
  }

  updateStatusOrRole(data: JobPartCrewUpdate, crew: JobPartCrew) {
    this.post<JobPartCrew>('Schedule/JobPartCrewStatusOrRoleUpdate', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          if (crew) {
            crew.loading = false;
          }
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
          } else {
            const jobPartCrew: Array<JobPartCrew> = this.list.find(it => it.jobPartId === res.data.jobPartId)?.crews as Array<JobPartCrew>;
            const updatedCrew: JobPartCrew = jobPartCrew?.find(it => it.jobPartCrewId === res.data.jobPartCrewId) as JobPartCrew;
            updatedCrew.jobPartCrewRoleId = res.data.jobPartCrewRoleId;
            updatedCrew.jobPartCrewStatusId = res.data.jobPartCrewStatusId;
            updatedCrew.jobPartCrewStatusColour = res.data.jobPartCrewStatusColour;
            GeneralService.showSuccessMessage();
          }
        }
      })
  }

  removeCrew(crew: JobPartCrew) {
    const data = {
      jobPartId: this.selectedSchedule.jobPartId,
      crewId: crew.crewId
    };

    this.post<any>('Schedule/removeJobPartCrew', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            return;
          }

          const removedId = res.data;

          const updateAndSortCrews = (crews: JobPartCrew[]) =>
            crews.map(c =>
              c.jobPartCrewId === removedId
                ? { ...c, isActive: false, crewId: undefined, name: '' }
                : c
            )
              .sort((a, b) => Number(b.isActive) - Number(a.isActive));

          this.selectedSchedule.crews = updateAndSortCrews(this.selectedSchedule.crews);

          this._scheduleService.shifts.forEach(shift => {
            if (shift.jobPartId === this.selectedSchedule.jobPartId) {
              shift.crews = updateAndSortCrews(shift.crews);
            }
          });

          this.selectSchedule(this.selectedSchedule);
        }
      });
  }

  menuAction(menu: CrewActionItem, crew: JobPartCrew) {
    this.selectedCrew = crew;

    if (crew.loading) {
      return;
    }

    const data: JobPartCrewUpdate = {
      jobPartCrewId: crew.jobPartCrewId
    }

    switch (menu.action) {
      case CrewAction.SEND_SMS:
        this.openSendSmsToCrew();
        // this.sendNotification(crew);
        break;

      case CrewAction.ASSIGN:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.NOTIFY:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.REJECT:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.MARK_AS_CREW_CHIEF:
        crew.loading = true;
        data.jobPartCrewRoleId = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.MARK_AS_TEAM_LEADER:
        crew.loading = true;
        data.jobPartCrewRoleId = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.CONFIRM:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.TURN_DOWN:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;


        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.REMOVE:
        crew.loading = true;
        this.removeCrew(crew);
        break;

      case CrewAction.MARK_AS_NO_SHOW:
        crew.loading = true;
        data.jobPartCrewStatusid = menu.id;

        this.updateStatusOrRole(data, crew);
        break;

      case CrewAction.CHANGE:
        this.openCrewsPanel(null, null, this.selectedSchedule);
        break;

      default:
        console.warn('Unhandled action:', menu.action);
        break;
    }
  }

  selectSchedule(schedule: Schedule) {
    this.selectedSchedule = schedule;
    this._scheduleService.selectedShift$.next(this.selectedSchedule);
  }

  openJobShifts(schedule: Schedule) {
    this.openJobsShifts.emit(schedule);
  }

  getNotifications(schedule: Schedule) {
    if (schedule.notificationsLoader) return;

    schedule.notificationsLoader = true;

    this.get<Array<Notification>>(`Schedule/GetJobNotificationAsync/${ schedule.jobPartId }`)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          schedule.notificationsLoader = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          schedule.notifications = res.data;
          schedule.showNotifications = true;
        }
      })
  }

  getCrewSectionStyles(schedule: Schedule) {
    if (!schedule.isActive) {
      return {}
    }
    const crewCount = schedule.crews?.filter(it => it.isActive)?.length ?? 0;

    if (crewCount > schedule.crewNumber) {
      return {
        background: 'repeating-linear-gradient(-55deg, #222, #222 10px, #333 10px, #333 20px)'
      };
    }

    const allAreConfirmed = schedule.crews?.every(c => c.jobPartCrewStatusId === 2) ?? false;

    if (crewCount < schedule.crewNumber || !allAreConfirmed) {
      return {
        background: 'repeating-linear-gradient(to right, #f6ba52, #f6ba52 10px, #ffd180 10px, #ffd180 20px)'
      };
    }

    if (crewCount === schedule.crewNumber && allAreConfirmed) {
      return {
        background: 'linear-gradient(to bottom, PaleGreen, PaleGreen 50%, PaleGreen 50%, PaleGreen)'
      };
    }

    return {};
  }

  getVehicleInfo(schedule: Schedule, hideCars: boolean = false) {
    this.hideVehicles = hideCars;

    if (schedule.vehicleLoader) return;

    schedule.vehicleLoader = true;

    this.get<Array<Vehicle>>(`Schedule/GetScheduleVehicleListAsync/${ schedule.jobPartId }`)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          schedule.vehicleLoader = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.updateScheduleVehiclesInfo(res.data);

          this.openVehiclesModal(this.vehicleModal);
        }
      })
  }

  updateScheduleVehiclesInfo(vehicles: Array<Vehicle>) {
    this.vehiclesInfo.set(vehicles.map(vehicle => {
      return {
        ...vehicle,
        active: this.selectedSchedule.vehicles.map(it => it.vehicleId)?.includes(vehicle.vehicleId),
        fontAwsome: vehicle.vehicleId === 5 || vehicle.vehicleId === 6 ? '<i class="fa-solid fa-car-on"></i>' : vehicle.fontAwsome
      }
    }));
  }

  openVehiclesModal(value: TemplateRef<NgbModal>) {
    this._modal.open(value, { centered: true, size: 'md' })
  }

  closeVehiclePopup(vehicleModal: any, smsInfo: Array<ScheduleSmsInfo>) {
    if (!smsInfo) {
      vehicleModal.close();
      return;
    }

    vehicleModal.close();
    this.smsInfo.set(smsInfo);
    this.openSendSms();
  }

  onVehicleSelect(vehicle: Vehicle) {
    this._scheduleService.shifts = this._scheduleService.shifts.map(shift => {
      return {
        ...shift,
        vehicles: shift.jobPartId === this.selectedSchedule.jobPartId
          ? this.toggleVehicle(vehicle, shift.vehicles)
          : shift.vehicles
      };
    });

    this.selectedSchedule.vehicles = this.toggleVehicle(vehicle, this.selectedSchedule.vehicles);
    this.selectSchedule(this.selectedSchedule);
    this.updateScheduleVehiclesInfo(this.vehiclesInfo());
  }

  toggleVehicle(vehicle: Vehicle, list: Vehicle[]): Vehicle[] {
    const index = list.findIndex(v => v.vehicleId === vehicle.vehicleId);

    if (index > -1) {
      return [ ...list.slice(0, index), ...list.slice(index + 1) ];
    } else {
      return [ ...list, vehicle ];
    }
  }

  openSendSms() {
    this._modal.open(this.sendSmsModal, { centered: true, size: 'lg' })
  }

  openSendSmsToCrew() {
    this._modal.open(this.sendSmsToCrewModal, { centered: true, size: 'lg' })
  }

  getCrewDetails(crew: JobPartCrew, popover: NgbPopover) {
    if (crew.detailsLoading) return;

    crew.detailsLoading = true;

    this.get<Array<CrewDetailForShift>>(`Schedule/GetJobPartCrewDetailsAsync/${ crew.jobPartCrewId }`)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          crew.detailsLoading = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          this.shiftCrewDetails.set(res.data);
          popover.open();
        }
      })
  }

  updateShift(schedule: Schedule) {
    if (schedule.updateLoading) return;

    schedule.updateLoading = true;

    this.get<Schedule>(`Schedule/GetJobPartByJobPartId/${ schedule.jobPartId }`)
      .pipe(takeUntilDestroyed(this._dr), take(2))
      .subscribe({
        next: (res) => {
          schedule.updateLoading = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this._scheduleService.shifts = this._scheduleService.shifts.map(item => {
            if (item.jobPartId === schedule.jobPartId) {
              return {
                ...res.data,
                crews: this.fillArray(res.data.crews, res.data.crewNumber)
              };
            }
            return item;
          });

          this._scheduleService.jobScopedShifts = this._scheduleService.jobScopedShifts.map(item => {
            if (item.jobPartId === schedule.jobPartId) {
              return {
                ...res.data,
                crews: this.fillArray(res.data.crews, res.data.crewNumber)
              };
            }
            return item;
          });

          const params = {
            date: GeneralService.convertToDate(this._navService.date$.value),
            days: this._navService.days,
            regionFilter: this._navService.regionId,
            jobId: this.isJobScoped ? this.selectedSchedule?.jobId : null,
          };

          if (!params.jobId) {
            delete params.jobId;
          }

          this.post<Array<JobMessageStatus>>('Schedule/GetJobPartCrewAdditionalDetailsSms', params)
            .pipe(takeUntilDestroyed(this._dr))
            .subscribe(res => {
              this.updateSchedulesWithStatuses(res.data);
            });

          this.post<Array<JobPartCrewAdditionalDetail>>('Schedule/GetJobPartCrewAdditionalDetails', params)
            .pipe(takeUntilDestroyed(this._dr))
            .subscribe(res => {
              this.updateSchedulesWithCrewChanges(res.data);
            });
        }
      })
  }

  getInfoMultiple() {
    const params = {
      date: GeneralService.convertToDate(this._navService.date$.value),
      days: this._navService.days,
      jobId: this.isJobScoped ? this.selectedSchedule?.jobId : null
    };

    if (!params.jobId) {
      delete params.jobId;
    }

    const getStatuses$ = () => this.post<Array<JobMessageStatus>>('Schedule/GetJobPartCrewAdditionalDetailsSms', params);
    const getCrewAdditionalInfo$ = () => this.post<Array<JobPartCrewAdditionalDetail>>('Schedule/GetJobPartCrewAdditionalDetails', params);

    timer(4000, 60000).pipe(
      takeUntilDestroyed(this._dr),
      switchMap(() =>
        forkJoin({
          statuses: getStatuses$(),
          crewDetails: getCrewAdditionalInfo$()
        })
      )
    ).subscribe(({ statuses, crewDetails }) => {
      this.updateSchedulesWithStatuses(statuses.data);
      this.updateSchedulesWithCrewChanges(crewDetails.data);
    });
  }

  getInfo() {
    this._scheduleService.shiftsLoaded
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (date) => {
          if (date) {
            const params = {
              date: GeneralService.convertToDate(this._navService.date$.value),
              days: this._navService.days,
              regionFilter: this._navService.regionId,
              jobId: this.isJobScoped ? this.selectedSchedule?.jobId : null
            };

            if (!params.jobId) {
              delete params.jobId;
            }

            this.post<Array<JobMessageStatus>>('Schedule/GetJobPartCrewAdditionalDetailsSms', params)
              .pipe(takeUntilDestroyed(this._dr))
              .subscribe(res => {
                this.updateSchedulesWithStatuses(res.data);
              });
          }
        }
      });
  }

  getStatistics() {
    this._scheduleService.shiftsLoaded
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (loaded) => {
          if (loaded) {
            const params = {
              date: GeneralService.convertToDate(this._navService.date$.value),
              days: this._navService.days,
              regionId: this._navService.regionId
            };

            this.post('Dashboard/GetDashboarUpcomingDaysWithScheduleFilter', params)
              .pipe(takeUntilDestroyed(this._dr))
              .subscribe({
                next: (res) => {
                  if (res.errors?.errorCode) {
                    GeneralService.showErrorMessage(res.errors.message);
                    return;
                  }
                  this.statics.set(res.data[this.statisticByRegion()]);
                }
              })
          }
        }
      })
  }

  getStatisticByDate(startDate: string): Statistics {
    const targetDateOnly = startDate.substring(0, 10);

    return this.statics().find(it => it.startDate.substring(0, 10) === targetDateOnly);
  }

  statisticByRegion() {
    switch (this._navService.regionId) {
      case 0:
        return 'London';
      case 1:
        return 'London';
      case 2:
        return 'Birmingham';
      case 6:
        return 'Bristol';
      case 3:
        return 'Nice';
      case 4:
        return 'paris';
      case 7:
        return 'Scotland';
      case 9:
        return 'SECURITY';
      case 10:
        return 'NewYork';
      case 8:
        return 'Barcelona';
      default:
        return 'London';
    }
  }

  getJobPartCrewAdditionalDetails() {
    this._scheduleService.shiftsLoaded
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (date) => {
          if (date) {
            const params = {
              date: GeneralService.convertToDate(this._navService.date$.value),
              days: this._navService.days,
              regionFilter: this._navService.regionId,
              jobId: this.isJobScoped ? this.selectedSchedule?.jobId : null
            };

            if (!params.jobId) {
              delete params.jobId;
            }

            this.post<Array<JobPartCrewAdditionalDetail>>('Schedule/GetJobPartCrewAdditionalDetails', params)
              .pipe(takeUntilDestroyed(this._dr))
              .subscribe(res => {
                this.updateSchedulesWithCrewChanges(res.data);
              });
          }
        }
      });
  }

  updateSchedulesWithStatuses(statuses: JobMessageStatus[]): void {
    const compareAndUpdate = (list: any[]) =>
      list.map(schedule => {
        const status = statuses.find(s => s?.jobId === schedule?.jobId);
        if (!status) return schedule;

        // თუ ძველი მნიშვნელობები ჯერ არ არის განსაზღვრული — არ ვაყენებთ changed:true
        const isFirstTime = !(
          'messageStatus' in schedule ||
          'smsStatusColour' in schedule ||
          'smsStatusTitle' in schedule ||
          'smsStatusTitle' in schedule ||
          'lastModified' in schedule
        );

        const changed = !isFirstTime && (
          schedule.messageStatus !== status.messageStatus ||
          schedule.smsStatusColour !== status.smsStatusColour ||
          schedule.smsStatusTitle !== status.smsStatusTitle ||
          schedule.editedBy !== status.editedBy ||
          schedule.lastModified !== status.lastModified ||
          schedule.onsiteContact !== status.onsiteContact
        );

        return {
          ...schedule,
          messageStatus: status.messageStatus,
          smsStatusColour: status.smsStatusColour,
          smsStatusTitle: status.smsStatusTitle,
          lastModified: status.lastModified,
          editedBy: status.editedBy,
          onsiteContact: status.onsiteContact,
          changed,
        };
      });

    this._scheduleService.shifts = compareAndUpdate(this._scheduleService.shifts);
    this._scheduleService.jobScopedShifts = compareAndUpdate(this._scheduleService.jobScopedShifts);
  }

  updateSchedulesWithCrewChanges(crewStatuses: any[]): void {
    const crewKeysToCheck: (keyof typeof crewStatuses[0])[] = [
      'additionalFees',
      'crewSkillsText',
      'inConflict',
      'jobPartCrewId',
      'jobPartLateChange',
      'lateChange',
      'onHoliday',
      'onWarnings',
      'hours',
      'byNotification',
      'byCrewManager',
      'buddyDown',
      'buddyUp',
      'warningTitle'
    ];

    const updateCrews = (list: any[]) =>
      list.map(schedule => {
        if (!Array.isArray(schedule.crews)) return schedule;

        const updatedCrews = schedule.crews.map(crew => {
          const status = crewStatuses.find(s => s.jobPartCrewId === crew.jobPartCrewId && s?.jobId === crew?.jobId);
          if (!status) return crew;

          const isFirstTime = !crew.hasOwnProperty('changed');

          const changed = !isFirstTime && crewKeysToCheck.some(key => crew[key] !== status[key]);

          return {
            ...crew,
            ...Object.fromEntries(crewKeysToCheck.map(key => [ key, status[key] ])),
            changed,
          };
        });

        return {
          ...schedule,
          crews: updatedCrews
        };
      });

    this._scheduleService.shifts = updateCrews(this._scheduleService.shifts);
    this._scheduleService.jobScopedShifts = updateCrews(this._scheduleService.jobScopedShifts);
  }

  finishNoteEdit(schedule: Schedule) {
    this.updateShift(schedule);
  }

  scrollToItem(jpId: number) {
    const target = this.itemBlocks?.find(el =>
      el.nativeElement.getAttribute('data-id') === String(jpId)
    );

    if (target) {
      target.nativeElement.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }
}
