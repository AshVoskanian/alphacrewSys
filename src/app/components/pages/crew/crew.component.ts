import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { TableConfigs } from "../../../shared/interface/common";
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { TableComponent } from "../../../shared/components/ui/table/table.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../shared/services/general.service";
import { CrewIndex, CrewIndexResponse, CrewSearchParams } from "../../../shared/interface/crew";
import { Select2Module } from "ng-select2-component";
import { CrewFilterComponent } from "./crew-filter/crew-filter.component";
import { NgxPaginationModule } from "ngx-pagination";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-crew',
  imports: [ CardComponent, TableComponent, Select2Module, CrewFilterComponent, NgxPaginationModule ],
  templateUrl: './crew.component.html',
  styleUrl: './crew.component.scss'
})
export class CrewComponent extends ApiBase implements OnInit {
  private _router: Router = inject(Router);
  private readonly _dr = inject(DestroyRef);
  private _route: ActivatedRoute = inject(ActivatedRoute);

  loading: WritableSignal<boolean> = signal(false);
  totalCount: WritableSignal<number> = signal<number>(null);
  filterParams: WritableSignal<CrewSearchParams> = signal({ page: 1, pageSize: 20 });

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
    this.filter();
  }

  getCrewList(params: CrewSearchParams) {
    this.loading.set(true);

    GeneralService.clearObject(params);

    this.post<CrewIndexResponse>('Crew/GetCrewIndex', { ...params, ...this.filterParams() })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.crewIndex.map((crew: CrewIndex) => ({
            ...crew,
            id: crew.crewId,
            hours: `${ crew.completed }/${ crew.scheduled }`
          }));
          this.totalCount.set(res.data.rowCount);

          this.loading.set(false);
        },
        error: _ => {
          this.loading.set(false);
        }
      })
  }

  filter() {
    this._route.queryParams
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (params: CrewSearchParams) => {
          this.filterParams.set(
            {
              ...params,
              page: +params['page'] || 1,
              classification: +params['classification'] || 0,
              crewLevel: +params['crewLevel'] || 0,
              crewRegion: +params['crewRegion'] || 0,
              paymentOption: +params['paymentOption'] || 0,
              acive: +params['acive'] || null,
              pageSize: 20
            }
          )
          this.getCrewList(this.filterParams());
        }
      });
  }

  pageChanged(p: number) {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        page: p
      },
      queryParamsHandling: 'merge',
    });
  }

  itemSelect(crew: CrewIndex) {
    this._router.navigate([ 'crew', crew.crewId ]);
  }
}
