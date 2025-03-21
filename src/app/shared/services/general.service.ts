import { Injectable } from '@angular/core';
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor() { }

  public  static convertToDate(date: NgbDateStruct): Date {
    return new Date(date.year, date.month - 1, date.day + 1);
  }
}
