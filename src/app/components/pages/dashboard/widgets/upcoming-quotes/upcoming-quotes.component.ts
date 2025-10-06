import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CardComponent } from "../../../../../shared/components/ui/card/card.component";
import { TableComponent } from "../../../../../shared/components/ui/table/table.component";
import { TableConfigs } from "../../../../../shared/interface/common";
import { UpcomingQuotes } from "../../../../../shared/interface/dashboard";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../../../shared/services/general.service";

@Component({
  selector: 'app-upcoming-quotes',
  imports: [ CardComponent, TableComponent, CardComponent ],
  templateUrl: './upcoming-quotes.component.html',
  styleUrl: './upcoming-quotes.component.scss'
})
export class UpcomingQuotesComponent extends ApiBase implements OnInit {
  private _dr = inject(DestroyRef);

  public tableConfig: TableConfigs = {
    columns: [
      { title: 'ID', field_value: 'jobId', sort: true, type: 'link' },
      { title: 'Client', field_value: 'companyName', sort: true },
      { title: 'Venue', field_value: 'venueName', sort: true },
      { title: 'Starts', field_value: 'startDate', sort: true, type: 'date' },
      { title: 'Parts', field_value: 'parts', sort: true },
      { title: 'Entered', field_value: 'editedBy', sort: true },
      { title: 'Ordered By', field_value: 'orderedBy', sort: true },
    ],
    data: [] as UpcomingQuotes[]
  };

  ngOnInit() {
    this.getQuotes();
  }

  getQuotes() {
    this.get<Array<UpcomingQuotes>>('Dashboard/GetDashboardUpcomingQuotes')
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.map((quote: UpcomingQuotes) => ({ ...quote, id: quote.jobId }));
        }
      });
  }
}
