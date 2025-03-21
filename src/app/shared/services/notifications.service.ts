import {Injectable} from '@angular/core';
import {ToastrService} from 'ngx-toastr';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastr: ToastrService, private translate: TranslateService) {
  }

  showSuccess(message: string, title: string = 'MESSAGES.SUCCESS'): void {
    this.getTranslatedMessage(message).subscribe((txt) => {
      this.toastr.success(txt, this.translate.instant(title));
    });
  }

  showError(message: string, title: string = 'ERRORS.GENERAL_ERROR'): void {
    this.getTranslatedMessage(message).subscribe((txt) => {
      this.toastr.error(txt, this.translate.instant(title));
    });
  }

  private getTranslatedMessage(key: string): Observable<string> {
    return this.translate.get(key);
  }
}
