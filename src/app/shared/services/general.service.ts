import { Injectable } from '@angular/core';
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor() {
  }

  public static showSuccessMessage(title?: string) {
    Swal.fire({
      title: title || 'Successfully saved',
      icon: 'success',
      toast: true,
      position: "top-right",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    })
  }

  public static showErrorMessage(error: string) {
    Swal.fire({
      title: error,
      icon: 'error',
      toast: true,
      position: "top-right",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    })
  }

  public static convertToDate(date: NgbDateStruct): Date {
    const d = date;
    return new Date(Date.UTC(d.year, d.month - 1, d.day));
  }

  public static calculateHoursDifference(startDateIso: string, endDateIso: string): number {
    const startDate = new Date(startDateIso);
    const endDate = new Date(endDateIso);
    const diffInMilliseconds = endDate.getTime() - startDate.getTime();

    return diffInMilliseconds / (1000 * 60 * 60);
  }

  public static stripHtmlTags(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.innerText || "";
  }
}
