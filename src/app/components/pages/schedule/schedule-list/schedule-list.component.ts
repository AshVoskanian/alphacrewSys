import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  input,
  OnInit,
  Output,
  signal,
  TemplateRef,
  ViewChild,
  WritableSignal
} from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import {
  Crew,
  CrewActionItem,
  CrewDetailForShift,
  JobMessageStatus,
  JobPartCrew,
  JobPartCrewEdit,
  JobPartCrewUpdate,
  Notification,
  Schedule,
  ScheduleSmsInfo,
  Vehicle
} from "../../../../shared/interface/schedule";
import { NgxSpinnerModule } from "ngx-spinner";
import { DatePipe, NgStyle, TitleCasePipe } from "@angular/common";
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
import { CrewAction } from "../../../../shared/interface/enums/schedule";
import { ScheduleService } from "../schedule.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SvgIconComponent } from "../../../../shared/components/ui/svg-icon/svg-icon.component";
import { VehiclesComponent } from "./vehicles/vehicles.component";
import { SendSmsComponent } from "./send-sms/send-sms.component";
import { FilterPipe } from "../../../../shared/pipes/filter.pipe";
import { switchMap, take, timer } from "rxjs";
import { NavService } from "../../../../shared/services/nav.service";

@Component({
  selector: 'app-schedule-list',
  imports: [ CardComponent, NgxSpinnerModule, NgStyle, FeatherIconComponent,
    NgbPopoverModule, NgbAlertModule, VehiclesComponent, DatePipe, FilterPipe, TitleCasePipe,
    UkCarNumComponent, NgbTooltipModule, NgbDropdownModule, EditComponent, DatePipe, FormsModule, SvgIconComponent, SendSmsComponent ],
  providers: [ DatePipe ],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent extends ApiBase implements OnInit {
  private _dr = inject(DestroyRef);
  private _modal = inject(NgbModal);
  private _navService = inject(NavService);
  private _offCanvasService = inject(NgbOffcanvas);
  private _scheduleService = inject(ScheduleService);

  @ViewChild('editModal') editModal: any;
  @ViewChild('vehicleModal') vehicleModal: any;
  @ViewChild('sendSmsModal') sendSmsModal: SendSmsComponent;
  @ViewChild('shiftCrewDetailsRef') shiftCrewDetailsRef: any;

  private offcanvasRef?: NgbOffcanvasRef;

  @Input() list: Array<Schedule> = [];
  @Input() isJobScoped: boolean = false;
  @Output() openJobsShifts: EventEmitter<Schedule> = new EventEmitter<Schedule>();

  loading = input<boolean>(false);
  jobShiftsLoading = input<boolean>(false);

  selectedSchedule: Schedule;

  crewInfo: WritableSignal<JobPartCrewEdit> = signal(null);
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
      id: 2,
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
      icon: 'fa-solid fa-eye-slash f-16'
    },
    {
      id: 2,
      text: 'Change',
      action: CrewAction.CHANGE,
      color: 'text-success',
      icon: 'fa-solid fa-retweet f-18'
    }
  ]);
  smsInfo: WritableSignal<Array<ScheduleSmsInfo>> = signal([]);

  jobNoteLoader: boolean = false;
  crewNoteLoader: boolean = false;
  hideVehicles: boolean = false;


  ngOnInit() {
    this.getCrewList();
    this.checkIfCrewUpdate();
    this.getInfo();
    this.getInfoMultiple();
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

  edit(schedule: Schedule, type: 'comment' | 'crewNote') {
    if (type === 'comment') {
      schedule.editComment = true;
    }

    if (type === 'crewNote') {
      schedule.editCrewNote = true;
    }
  }

  saveNote(schedule: Schedule, type: 'comment' | 'crewNote') {
    if (type === 'comment') {
      this.updatePartNote(schedule);
    }

    if (type === 'crewNote') {
      this.updateCrewNote(schedule);
    }
  }

  updatePartNote(schedule: Schedule) {
    if (this.jobNoteLoader) return;

    this.jobNoteLoader = true;

    const data = {
      jobPartId: schedule.jobPartId,
      notes: schedule.notes
    }

    this.post('Schedule/updatejobpartnotes', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.jobNoteLoader = false;

          if (res.errors?.errorCode) {

          } else {
            schedule.editComment = false;
            GeneralService.showSuccessMessage();
          }
        }
      })
  }

  updateCrewNote(schedule: Schedule) {
    if (this.crewNoteLoader) return;

    this.crewNoteLoader = true;

    const data = {
      jobPartId: schedule.jobPartId,
      notes: schedule.crewNotes
    }
    this.post('Schedule/updatejobpartcrewnotes', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.crewNoteLoader = false;

          if (res.errors?.errorCode) {

          } else {
            schedule.editCrewNote = false;
            GeneralService.showSuccessMessage();
          }
        }
      })
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
    if (crew.loading) {
      return;
    }

    const data: JobPartCrewUpdate = {
      jobPartCrewId: crew.jobPartCrewId
    }

    switch (menu.action) {
      case CrewAction.SEND_SMS:
        crew.loading = true;
        this.sendNotification(crew);
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


  sendNotification(crew?: JobPartCrew) {
    const data = {
      job_Id: this.selectedSchedule.jobId,
      job_Part_Id: this.selectedSchedule.jobPartId,
      crewId: [ crew.crewId ]
    }
    this.post('Schedule/AddJobNotifiction', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          crew.loading = false;

          if (res?.errors?.errorCode) return;

          GeneralService.showSuccessMessage('Successfully sent');
        }
      })
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

  getNotificationStatusClass(status: number): { border: string, color: string, bg: string } {
    const colorData = {
      0: {
        border: 'primary',
        color: 'primary',
        bg: 'primary-subtle'
      },
      1: {
        border: 'primary',
        color: 'primary',
        bg: 'primary-subtle'
      },
      2: {
        border: 'primary',
        color: 'success',
        bg: 'success-subtle'
      },
      3: {
        border: 'success',
        color: 'success',
        bg: 'success-subtle'
      },
      4: {
        border: 'danger',
        color: 'danger',
        bg: 'danger-subtle'
      },
      5: {
        border: 'danger',
        color: 'danger',
        bg: 'danger-subtle'
      },
      6: {
        border: 'dark',
        color: 'dark',
        bg: 'dark-subtle'
      },
      7: {
        border: 'info',
        color: 'primary',
        bg: 'info-subtle'
      }
    };
    return colorData[status];
  }

  getCrewSectionStyles(schedule: Schedule) {
    if (schedule.statusId !== 3) {
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
            jobId: this.isJobScoped ? this.selectedSchedule.jobId : null
          };

          if (!params.jobId) {
            delete params.jobId;
          }

          this.post<Array<JobMessageStatus>>('Schedule/GetJobPartAdditionalDetailsSms', params)
            .pipe(takeUntilDestroyed(this._dr))
            .subscribe(res => {
              this.updateSchedulesWithStatuses(res.data);
            });
        }
      })
  }

  getInfoMultiple() {
    const params = {
      date: GeneralService.convertToDate(this._navService.date$.value),
      days: this._navService.days,
      jobId: this.isJobScoped ? this.selectedSchedule.jobId : null
    };

    if (!params.jobId) {
      delete params.jobId;
    }

    const getInfo$ = () => this.post<Array<JobMessageStatus>>('Schedule/GetJobPartAdditionalDetailsSms', params);

    timer(4000, 60000)
      .pipe(
        takeUntilDestroyed(this._dr),
        switchMap(() => getInfo$())
      )
      .subscribe(res => {
        this.updateSchedulesWithStatuses(res.data);
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
              jobId: this.isJobScoped ? this.selectedSchedule.jobId : null
            };

            if (!params.jobId) {
              delete params.jobId;
            }

            this.post<Array<JobMessageStatus>>('Schedule/GetJobPartAdditionalDetailsSms', params)
              .pipe(takeUntilDestroyed(this._dr))
              .subscribe(res => {
                this.updateSchedulesWithStatuses(res.data);
              });
          }
        }
      });
  }

  updateSchedulesWithStatuses(statuses: JobMessageStatus[]): void {
    const compareAndUpdate = (list: any[]) =>
      list.map(schedule => {
        const status = statuses.find(s => s.jobId === schedule.jobId);
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
}
