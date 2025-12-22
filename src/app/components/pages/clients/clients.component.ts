import { Component, DestroyRef, inject, OnInit, signal, TemplateRef, WritableSignal } from '@angular/core';
import { TableConfigs } from "../../../shared/interface/common";
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { TableComponent } from "../../../shared/components/ui/table/table.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../shared/services/general.service";
import { CrewSearchParams } from "../../../shared/interface/crew";
import { Select2Module } from "ng-select2-component";
import { ClientsFilterComponent } from "./clients-filter/clients-filter.component";
import { NgxPaginationModule } from "ngx-pagination";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ClientsFormComponent } from "./clients-form/clients-form.component";
import { Client, ClientDetails, ClientIndexResponse, ClientSearchParams } from "../../../shared/interface/clients";

@Component({
  selector: 'app-venue',
  imports: [ CardComponent, TableComponent, Select2Module, ClientsFilterComponent, NgxPaginationModule, ClientsFormComponent ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent extends ApiBase implements OnInit {
  private _router: Router = inject(Router);
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _sanitizer: DomSanitizer = inject(DomSanitizer);

  loading: WritableSignal<boolean> = signal(false);
  totalCount: WritableSignal<number> = signal<number>(null);
  filterParams: WritableSignal<ClientSearchParams> = signal({ page: 1, pageSize: 20 });

  public tableConfig: TableConfigs = {
    columns: [
      { title: '', field_value: 'statusText', sort: false },
      { title: 'Client Name', field_value: 'companyName', sort: true, type: 'action' },
      { title: 'Contact', field_value: 'contactName', sort: true },
      { title: 'PostCode', field_value: 'postcode', sort: true },
      { title: 'Email', field_value: 'emailAddress', sort: true },
      { title: 'Phone', field_value: 'phoneNumber', sort: true }
    ],
    data: [] as Client[]
  };

  private modalRef!: NgbModalRef;

  ngOnInit() {
    this.subToFilterParams();
  }

  getClientsList(params: ClientSearchParams) {
    this.loading.set(true);

    GeneralService.clearObject(params);

    this.post<ClientIndexResponse>('Clients/GetClientIndex', { ...params, ...this.filterParams() })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.clientIndex.map((client: Client) => ({
            ...client,
            id: client.clientId,
            statusText: this._sanitizer.bypassSecurityTrustHtml(
              client.isActive
                ? '<i class="fa-solid fa-circle-check text-success"></i>'
                : '<i class="fa-solid fa-circle-xmark text-danger"></i>'
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
                clientId: 0,
                active: (+params['active'] === 0 || +params['active'] === 1) ? +params['active'] : null,
                pageSize: 20
              }
            )

            this.getClientsList(this.filterParams());
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

  itemSelect(client: Client) {
    this._router.navigate([ 'clients', client.clientId ]);
  }

  addNewClient(temp: TemplateRef<NgbModal>) {
    this.modalRef = this._modal.open(temp, { centered: true, size: 'xl' })
  }

  goToCreatedClientDetails(clientDetails: ClientDetails) {
    this.modalRef.close();
    this._router.navigate([ 'clients', clientDetails?.clientId ]);
  }
}
