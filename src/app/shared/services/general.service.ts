import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";
import { FormGroup } from "@angular/forms";
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor(private readonly http: HttpClient) {
  }

  public static markFormGroupTouched(formGroup: FormGroup) {
    (Object as any).values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  public static isEmpty(obj: any): boolean {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
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

  public static stripHtmlTagsWithLineBreaks(html: string): string {
    const withLineBreaks = html.replace(/<br\s*\/?>/gi, '\n');

    const doc = new DOMParser().parseFromString(withLineBreaks, 'text/html');

    return doc.body.textContent || '';
  }

  public static readonly EMAIL_TEXT_STYLE =
    'font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 14px; color: #696969;';

  public static buildEmailHistoryQuote(previousHtml: string, formattedSentDate: string): string {
    const trimmedHtml = typeof previousHtml === 'string' ? previousHtml.trim() : '';

    if (!trimmedHtml) {
      return '';
    }

    const datePrefix = formattedSentDate ? `On ${ formattedSentDate }, ` : '';

    return `<br /><br /><br />
    ${ datePrefix }"Alphacrew Accounts" &lt;accounts@alphacrew.co.uk&gt; wrote
<br />
<blockquote>
${ trimmedHtml }
</blockquote>`;
  }

  public static wrapEmailHtml(html: string, maxWidth = 600): string {
    const trimmedHtml = typeof html === 'string' ? html.trim() : '';

    if (!trimmedHtml) {
      return '';
    }

    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; width: 100%;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${ maxWidth }" style="border-collapse: collapse; max-width: ${ maxWidth }px; width: 100%;">
        <tr>
          <td style="${ this.EMAIL_TEXT_STYLE }">
            ${ trimmedHtml }
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  public static clearObject(object: any, zeroCheck: boolean = false): any {
    for (const item in object) {
      if (object.hasOwnProperty(item)) {
        if (typeof object[item] === 'string' && !object[item]) {
          delete object[item];
        }
        if (object[item] === null) {
          delete object[item];
        }
        if (object[item] === undefined) {
          delete object[item];
        }
        if (zeroCheck && object[item] === 0) {
          delete object[item];
        }
        if (object[item] && object[item].length === 0) {
          delete object[item];
        }
      }
    }
  }

  public openBlobInNewTab(blob: Blob): void {
    const objectUrl = URL.createObjectURL(blob);
    const newWindow = window.open(objectUrl, '_blank');

    if (!newWindow) {
      URL.revokeObjectURL(objectUrl);
      return;
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  public downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  public downloadFile(endpoint: string, fileName: string): Observable<Blob> {
    const url = `${environment.apiUrl}/${endpoint}`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      tap(blob => this.downloadBlob(blob, fileName))
    );
  }
}
