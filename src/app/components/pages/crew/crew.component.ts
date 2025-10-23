import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { TableConfigs } from "../../../shared/interface/common";
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { TableComponent } from "../../../shared/components/ui/table/table.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../shared/services/general.service";
import { CrewIndex } from "../../../shared/interface/crew";

@Component({
  selector: 'app-crew',
  imports: [ CardComponent, TableComponent ],
  templateUrl: './crew.component.html',
  styleUrl: './crew.component.scss'
})
export class CrewComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);

  loading = signal(false);

  public tableConfig: TableConfigs = {
    columns: [
      { title: 'Crew name', field_value: 'name', sort: true },
      { title: 'Hours', field_value: 'hours', sort: true },
      { title: 'Classif', field_value: 'classText', sort: true },
      { title: 'PayOpt', field_value: 'paymentOptionText', sort: true },
      { title: 'Region', field_value: 'regionText', sort: true },
      { title: 'PostCode', field_value: 'postcode', sort: true },
      { title: 'Phone', field_value: 'phoneNumber', sort: true },
      { title: 'Email', field_value: 'email', sort: true },
      { title: 'Level', field_value: 'levelText', sort: true },
    ],
    data: [] as CrewIndex[]
  };

  ngOnInit() {
    this.getCrewList();
  }

  getCrewList() {
    this.loading.set(true);

    const body = {
      page: 1,
      pageSize: 2000
    }

    this.post<CrewIndex[]>('Crew/GetCrewIndex', body)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.map((crew: CrewIndex) => ({
            ...crew,
            id: crew.crewId,
            hours: `${ crew.completed }/${ crew.scheduled }`
          }));
          this.loading.set(false);
        },
        error: err => {
          this.loading.set(false);
        }
      })
  }
}
