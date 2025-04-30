import { Component, inject, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { Select2Module } from "ng-select2-component";
import { NgbDateStruct, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ScheduleListComponent } from "./schedule-list/schedule-list.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { JobPartCrew, Schedule } from "../../../shared/interface/schedule";
import { GeneralService } from "../../../shared/services/general.service";
import { ToastrService } from "ngx-toastr";
import { FeatherIconComponent } from "../../../shared/components/ui/feather-icon/feather-icon.component";
import { NavService } from "../../../shared/services/nav.service";
import { ScheduleService } from "./schedule.service";

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [ CardComponent, Select2Module, ScheduleListComponent, FeatherIconComponent ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent extends ApiBase implements OnInit {
  @ViewChild('scheduleModal') scheduleModal: any;

  private _modal = inject(NgbModal);
  private _navService = inject(NavService);
  private _toast = inject(ToastrService);
  public scheduleService = inject(ScheduleService);

  loading: WritableSignal<boolean> = signal(false);
  JobScheduleLoading: WritableSignal<boolean> = signal(false);

  sidebar: any = [
    {
      id: 2,
      title: 'Completed',
      value: 'completed',
      icon: 'check-circle',
      color: 'success',
      count: 10
    },
    {
      id: 3,
      title: 'Pending',
      value: 'pending',
      icon: 'cast',
      color: 'danger',
      count: 8
    },
    {
      id: 4,
      title: 'In Process',
      value: 'in_progress',
      icon: 'activity',
      color: 'info',
      count: 133
    }
  ]

  ngOnInit() {
    const today = new Date();
    const initialDate: NgbDateStruct = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
    this.getScheduleData(initialDate, null);
    this.subToDateChange();
  }


  subToDateChange() {
    this._navService.date$.subscribe({
      next: (date) => {
        if (date) {
          this.getScheduleData(date, null);
        }
      }
    });
  }

  getScheduleData(date: NgbDateStruct, jobId: number) {
    if (this.loading()) return;


    if (jobId) {
      this.JobScheduleLoading.set(true);
    } else {
      this.loading.set(true);
    }

    const params = {
      jobId,
      date: GeneralService.convertToDate(date),
      days: 7,
    }

    if (!jobId) {
      delete params.jobId;
    }

    this.post<Array<Schedule>>('schedule/getschedule', params)
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.JobScheduleLoading.set(false);

          if (res.errors?.errorCode) {
            this._toast.error(res.errors.message)
          } else {
            if (jobId) {
              this.scheduleService.jobScopedShifts = res.data;
              this.scheduleService.jobScopedShifts.forEach(it => this.fillArray(it.crews, it.crewNumber));
              this._modal.open(this.scheduleModal, { centered: true, fullscreen: true })
            } else {
              this.scheduleService.shifts = res.data;
              this.scheduleService.shifts.forEach(it => this.fillArray(it.crews, it.crewNumber));
            }
          }
        }
      })
  }

  fillArray(arr: Array<JobPartCrew>, length: number): void {
    arr.forEach(item => item.isActive = true);

    while (arr.length < length) {
      arr.push({
        name: '',
        crewId: undefined,
        isActive: false
      });
    }
  }

  openModal(schedule: Schedule) {
    const today = new Date();
    const initialDate: NgbDateStruct = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };

    this.getScheduleData(initialDate, schedule.jobId);
  }

  protected readonly close = close;

  closeModal(modal: any) {
    this.setMainListDataFromJobShiftsData();
    modal.close();
    console.log(this.scheduleService.shifts)
  }

  setMainListDataFromJobShiftsData() {
    // this.scheduleData.set(
    //   this.scheduleData().map(itemA => {
    //     const matchingB = this.jobScheduleData().find(itemB => itemB.jobId === itemA.jobId);
    //     return matchingB ? matchingB : itemA;
    //   })
    // );
    // console.log(this.scheduleData(), 4545)
    // console.log(this.jobScheduleData(), 2222)
  }
}
