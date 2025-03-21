import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { Select2Module } from "ng-select2-component";
import { NgbDateStruct, NgbInputDatepicker } from "@ng-bootstrap/ng-bootstrap";
import { ScheduleListComponent } from "./schedule-list/schedule-list.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { Schedule } from "../../../shared/interface/schedule";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { GeneralService } from "../../../shared/services/general.service";
import { ToastrService } from "ngx-toastr";
import { delay } from "rxjs";

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [ CardComponent, Select2Module, NgbInputDatepicker, ScheduleListComponent ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent extends ApiBase implements OnInit {
  private _fb = inject(FormBuilder);
  private _toast = inject(ToastrService);

  scheduleData: WritableSignal<Array<Schedule>> = signal([]);
  loading: WritableSignal<boolean> = signal(false);

  form: FormGroup;

  ngOnInit() {
    this.initForm();
    this.getScheduleData();
  }

  initForm() {
    const today = new Date();
    const initialDate: NgbDateStruct = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };

    this.form = this._fb.group({
      date: [ initialDate, [ Validators.required ] ]
    });
  }

  getScheduleData() {
    if (this.loading()) return;

    this.loading.set(true);

    const params = {
      date: GeneralService.convertToDate(this.form.get('date')?.value),
      days: 7
    }

    this.post<Array<Schedule>>('schedule/getschedule', params)
      .pipe(delay(3000))
      .subscribe({
        next: (res) => {
          this.loading.set(false);

          if (res.errors?.errorCode) {
            this._toast.error(res.errors.message)
          } else {
            this.scheduleData.set(res.data);
            console.log(res.data);
          }
        }
      })
  }

  submit() {
    if (this.form.valid) {
      this.getScheduleData();
    }
  }
}
