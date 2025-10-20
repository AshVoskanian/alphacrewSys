import { Component, inject, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { Select2Module } from "ng-select2-component";
import { NgbDateStruct, NgbModal, NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { ScheduleListComponent } from "./schedule-list/schedule-list.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { JobPartCrew, Schedule } from "../../../shared/interface/schedule";
import { GeneralService } from "../../../shared/services/general.service";
import { ToastrService } from "ngx-toastr";
import { NavService } from "../../../shared/services/nav.service";
import { ScheduleService } from "./schedule.service";
import { SKILLS } from "../../../shared/data/skills";
import { ScheduleGridComponent } from "./schedule-grid/schedule-grid.component";
import { AsyncPipe } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [ Select2Module, ScheduleListComponent, ScheduleGridComponent, AsyncPipe ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent extends ApiBase implements OnInit {
  @ViewChild('scheduleModal') scheduleModal: any;

  private _modal = inject(NgbModal);
  private _router = inject(Router);
  public _navService = inject(NavService);
  private _toast = inject(ToastrService);
  private _offcanvas = inject(NgbOffcanvas);
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
    this.subToDateChange();
  }

  subToDateChange() {
    this._navService.filterParams.subscribe({
      next: (params) => {
        if (params) {
          this.getScheduleData(params.date, params.jobId, false);
        }
      }
    });
  }

  getScheduleData(date: NgbDateStruct, jobId: number, openModal: boolean = true) {
    if (this.loading() || this.JobScheduleLoading()) return;

    if (jobId && openModal) {
      this.JobScheduleLoading.set(true);
    } else {
      this.loading.set(true);
    }

    const params = {
      jobId,
      date: GeneralService.convertToDate(date),
      days: this._navService.days,
      regionFilter: this._navService.regionId,
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
            this.scheduleService.shiftsLoaded.next(true);

            if (jobId && openModal) {
              this.scheduleService.jobScopedShifts = res.data;
              this.scheduleService.jobScopedShifts.forEach(it => {
                  it.transformedSkills = [];
                  this.setSkills(it);
                  this.fillArray(it.crews, it.crewNumber);
                }
              );
              this._modal.open(this.scheduleModal, { centered: true, fullscreen: true });
              const queryParams = {
                jobId
              }
              this._router.navigate([ 'schedule' ], { queryParams });
            } else {
              this.scheduleService.shifts = res.data;
              this.scheduleService.shifts.forEach(it => {
                it.transformedSkills = [];
                this.setSkills(it);
                this.fillArray(it.crews, it.crewNumber);
              });
            }
          }
        }
      })
  }

  setSkills(schedule: Schedule) {
    const skills: { [key: string]: any } = schedule.jobPartSkills;
    for (const [ key, value ] of Object.entries(skills)) {
      schedule.transformedSkills.push({ name: this.formatSkillName(key), url: SKILLS[key], active: value ?? false });
    }
  }

  formatSkillName(key: string): string {
    const readable = key.replace(/^skill/, '').replace(/([A-Z])/g, ' $1').trim();
    return `Skill: ${ readable }`;
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

  closeModal(modal: any) {
    if (this._offcanvas.hasOpenOffcanvas()) {
      this._offcanvas.dismiss();

      setTimeout(() => {
        this.scheduleService.closeJobScopedShiftModal$.next(true);
        modal.close();

        const queryParams = {};
        this._router.navigate([ 'schedule' ], { queryParams });

        setTimeout(() => {
          if (document.body.style.overflow === 'hidden') {
            document.body.style.overflow = 'auto';
          }
        }, 100);
      }, 150);
    } else {
      this.scheduleService.closeJobScopedShiftModal$.next(true);
      modal.close();
      const queryParams = {};
      this._router.navigate([ 'schedule' ], { queryParams });
    }
  }
}
