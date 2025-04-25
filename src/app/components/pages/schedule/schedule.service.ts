import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { JobPartCrew, Schedule } from "../../../shared/interface/schedule";

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  selectedShift$: BehaviorSubject<Schedule | null> = new BehaviorSubject<Schedule | null>(null);
  crewUpdate$: BehaviorSubject<Array<Schedule> | null> = new BehaviorSubject<Array<Schedule> | null>(null);

  constructor() {
  }
}
