import { Injectable } from '@angular/core';
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor() {
  }

  public static convertToDate(date: NgbDateStruct): Date {
    return new Date(date.year, date.month - 1, date.day + 1);
  }

  public static calculateHoursDifference(startDateIso: string, endDateIso: string): number {
    const startDate = new Date(startDateIso);
    const endDate = new Date(endDateIso);
    const diffInMilliseconds = endDate.getTime() - startDate.getTime();

    return diffInMilliseconds / (1000 * 60 * 60);
  }
}
