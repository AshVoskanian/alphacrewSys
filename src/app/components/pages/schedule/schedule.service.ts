import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { JobPartCrew, Schedule } from "../../../shared/interface/schedule";

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  selectedShift$: BehaviorSubject<Schedule | null> = new BehaviorSubject<Schedule | null>(null);
  crewUpdate$: BehaviorSubject<Array<JobPartCrew> | null> = new BehaviorSubject<Array<JobPartCrew> | null>(null);

  constructor() {
  }
}
