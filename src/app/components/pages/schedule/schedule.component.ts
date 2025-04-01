import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { Select2Module } from "ng-select2-component";
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { ScheduleListComponent } from "./schedule-list/schedule-list.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { JobPartCrew, Schedule } from "../../../shared/interface/schedule";
import { GeneralService } from "../../../shared/services/general.service";
import { ToastrService } from "ngx-toastr";
import { FeatherIconComponent } from "../../../shared/components/ui/feather-icon/feather-icon.component";
import { NavService } from "../../../shared/services/nav.service";

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [ CardComponent, Select2Module, ScheduleListComponent, FeatherIconComponent ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent extends ApiBase implements OnInit {

  private _navService = inject(NavService);
  private _toast = inject(ToastrService);

  scheduleData: WritableSignal<Array<Schedule>> = signal([]);
  loading: WritableSignal<boolean> = signal(false);

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
    this.getScheduleData(initialDate);
    this.subToDateChange();
  }


  subToDateChange() {
    this._navService.date$.subscribe({
      next: (date) => {
        if (date) {
          this.getScheduleData(date);
        }
      }
    });
  }

  getScheduleData(date: NgbDateStruct) {
    if (this.loading()) return;

    this.loading.set(true);

    const params = {
      date: GeneralService.convertToDate(date),
      days: 7
    }

    this.post<Array<Schedule>>('schedule/getschedule', params)
      .subscribe({
        next: (res) => {
          this.loading.set(false);

          if (res.errors?.errorCode) {
            this._toast.error(res.errors.message)
          } else {
            this.scheduleData.set(res.data);
            this.scheduleData().forEach(it => this.fillArray(it.crews, it.crewNumber));
          }
        }
      })
  }

  fillArray(arr: Array<JobPartCrew>, length: number): void {
    arr.forEach(item => item.isActive = true);

    while (arr.length < length) {
      arr.push({
        name: '',
        crewId: arr.length + 1,
        isActive: false
      });
    }
  }
}
