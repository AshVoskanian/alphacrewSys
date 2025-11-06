import { Component, DestroyRef, inject, input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { CrewMainListItem, MainListComponent } from "../main-list/main-list.component";
import { CrewDetail, CrewFeedback } from "../../../../../shared/interface/crew";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { GeneralService } from "../../../../../shared/services/general.service";

@Component({
  selector: 'app-crew-feedback',
  imports: [ MainListComponent ],
  templateUrl: './crew-feedback.component.html',
  styleUrl: './crew-feedback.component.scss'
})
export class CrewFeedbackComponent extends ApiBase implements OnChanges {
  private readonly _dr = inject(DestroyRef);

  crewDetail = input<CrewDetail>();

  loading = signal<boolean>(false);

  feedbacks = signal<CrewMainListItem<CrewFeedback>[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getFeedbacks(this.crewDetail());
    }
  }


  getFeedbacks(crewDetail: CrewDetail) {
    this.loading.set(true);

    const { crewId } = crewDetail;

    this.get<CrewFeedback[]>('Crew/GetCrewFeedBack', { crewId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message)
            return;
          }
          this.feedbacks.set(
            res.data.map(it => ({
              title: `
                On Time: ${ it.early === 1 ? 'Yes' : 'No' } </br>
                Presentation: ${ it.presentation } </br>
                Teamwork: ${ it.teamwork } </br>
                Professionalism: ${ it.professionalism } </br>
                Attitude: ${ it.attitude }
              `,
              date: it.modifiedDate,
              desc: it.ratingtext || '---'
            }))
          )
        }
      })
  }
}
