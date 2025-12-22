import { Component, DestroyRef, inject, OnInit, signal, TemplateRef, WritableSignal } from '@angular/core';
import { TableConfigs } from "../../../shared/interface/common";
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { TableComponent } from "../../../shared/components/ui/table/table.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../shared/services/general.service";
import { CrewSearchParams } from "../../../shared/interface/crew";
import { Select2Module } from "ng-select2-component";
import { VenueFilterComponent } from "./venue-filter/venue-filter.component";
import { NgxPaginationModule } from "ngx-pagination";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Venue, VenueDetails, VenueIndexResponse, VenueSearchParams } from "../../../shared/interface/venue";
import { VenueFormComponent } from "./venue-form/venue-form.component";

@Component({
  selector: 'app-venue',
  imports: [ CardComponent, TableComponent, Select2Module, VenueFilterComponent, NgxPaginationModule, VenueFormComponent ],
  templateUrl: './venue.component.html',
  styleUrl: './venue.component.scss'
})
export class VenueComponent extends ApiBase implements OnInit {
  private _router: Router = inject(Router);
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _sanitizer: DomSanitizer = inject(DomSanitizer);

  loading: WritableSignal<boolean> = signal(false);
  profileLoading: WritableSignal<boolean> = signal(false);
  totalCount: WritableSignal<number> = signal<number>(null);
  filterParams: WritableSignal<VenueSearchParams> = signal({ page: 1, pageSize: 20 });

  public tableConfig: TableConfigs = {
    columns: [
      { title: '', field_value: 'statusText', sort: false },
      { title: 'Venue name', field_value: 'venueName', sort: true, type: 'action' },
      { title: 'Address', field_value: 'address', sort: true },
      { title: 'PostCode', field_value: 'postCode', sort: true },
      { title: 'Region', field_value: 'regionText', sort: true },
      { title: 'Mileage', field_value: 'milage', sort: true },
      { title: 'Notes', field_value: 'notes', sort: false }
    ],
    data: [] as Venue[]
  };

  private modalRef!: NgbModalRef;

  ngOnInit() {
    this.subToFilterParams();
  }

  getVenueList(params: VenueSearchParams) {
    this.loading.set(true);

    GeneralService.clearObject(params);

    this.post<VenueIndexResponse>('Venues/GetVenueIndex', { ...params, ...this.filterParams() })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.venueIndex.map((venue: Venue) => ({
            ...venue,
            id: venue.venueId,
            statusText: this._sanitizer.bypassSecurityTrustHtml(
              venue.temporaryEntry
                ? '<i class="fa-solid fa-clock text-success"></i>'
                : '<i class="fa-solid fa-rotate text-danger"></i>'
            )
          }));

          this.totalCount.set(res.data.rowCount);

          this.loading.set(false);
        },
        error: _ => {
          this.loading.set(false);
        }
      })
  }

  subToFilterParams() {
    this._route.queryParams
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (params: CrewSearchParams) => {
          if (!GeneralService.isEmpty(params)) {
            this.filterParams.set(
              {
                ...params,
                page: +params['page'] || 1,
                venueId: 0,
                includeTemporary: (+params['includeTemporary'] === 0 || +params['includeTemporary'] === 1) ? +params['includeTemporary'] : null,
                pageSize: 20
              }
            )

            this.getVenueList(this.filterParams());
          }
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

  itemSelect(venue: Venue) {
    this._router.navigate([ 'venue', venue.venueId ]);
  }

  addNewVenue(temp: TemplateRef<NgbModal>) {
    this.modalRef = this._modal.open(temp, { centered: true, size: 'xl' })
  }

  goToCreatedVenueDetails(venueDetails: VenueDetails) {
    this.modalRef.close();
    this._router.navigate([ 'venue', venueDetails?.venueId ]);
  }
}
