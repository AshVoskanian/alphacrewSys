import { Component, DestroyRef, inject, OnInit, signal, TemplateRef, WritableSignal } from '@angular/core';
import { TableConfigs } from "../../../shared/interface/common";
import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { TableComponent } from "../../../shared/components/ui/table/table.component";
import { ApiBase } from "../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../shared/services/general.service";
import { Select2Module } from "ng-select2-component";
import { NgxPaginationModule } from "ngx-pagination";
import { ActivatedRoute, Router } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Client, ClientDetails } from "../../../shared/interface/clients";
import { JobsFilterComponent } from "./jobs-filter/jobs-filter.component";
import { Job, JobResponse, JobSearchParams } from "../../../shared/interface/jobs";

@Component({
  selector: 'app-jobs',
  imports: [ CardComponent, TableComponent, Select2Module, NgxPaginationModule, JobsFilterComponent ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss'
})
export class JobsComponent extends ApiBase implements OnInit {
  private _router: Router = inject(Router);
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _sanitizer: DomSanitizer = inject(DomSanitizer);

  loading: WritableSignal<boolean> = signal(false);
  totalCount: WritableSignal<number> = signal<number>(null);
  filterParams: WritableSignal<JobSearchParams> = signal({ page: 1, pageSize: 20 });

  public tableConfig: TableConfigs = {
    columns: [
      { title: '', field_value: 'jobId' },
      { title: 'Company/Venue', field_value: 'companyName', sort: true, type: 'action' },
      { title: 'Status', field_value: 'statusText', sort: true },
      { title: '', field_value: 'statusContent' },
      { title: 'Region', field_value: 'regionText', sort: true },
      { title: 'Parts', field_value: 'parts' },
      { title: 'Start', field_value: 'starts', type: 'date' },
      { title: 'End', field_value: 'ends', type: 'date' },
      { title: 'Hours', field_value: 'totalHours' },
      { title: 'Cost', field_value: 'cost' },
    ],
    data: [] as Job[]
  };

  private modalRef!: NgbModalRef;

  ngOnInit() {
    this.subToFilterParams();
  }

  getJobsList(params: JobSearchParams) {
    this.loading.set(true);

    GeneralService.clearObject(params);

    this.post<JobResponse>('/Jobs/GetJobIndex', { ...params, ...this.filterParams() })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.data = res.data.jobIndex.map((job: Job) => ({
            ...job,
            id: job.jobId,
            statusText: this._sanitizer.bypassSecurityTrustHtml(`<i class="${this._getStatusIcon(14)}"></i> ${ job.statusText }`)
          }));

          this.totalCount.set(res.data.rowCount);

          this.loading.set(false);
        },
        error: _ => {
          this.loading.set(false);
        }
      })
  }

  private _getStatusIcon(statusId: number): string {
    const map: Record<number, string> = {
      0:  'fa-solid fa-layer-group text-dark',

      1:  'fa-solid fa-file text-dark',                 // Draft
      2:  'fa-solid fa-quote-right text-primary',        // Quote
      3:  'fa-solid fa-circle-check text-success',       // Confirmed
      4:  'fa-solid fa-ban text-danger',                 // Cancelled

      6:  'fa-solid fa-flag-checkered text-success',     // Completed
      60: 'fa-solid fa-flag text-success',               // Completed (Non-AC)

      7:  'fa-solid fa-file-invoice text-primary',       // Invoiced
      8:  'fa-solid fa-check-double text-success',       // Paid
      9:  'fa-solid fa-coins text-warning',               // Part-Paid

      10: 'fa-solid fa-scale-balanced text-warning-emphasis', // In-Dispute
      12: 'fa-solid fa-trash-can text-dark',              // Writeoff

      14: 'fa-solid fa-file-lines text-primary',         // Pro-Forma

      30: 'fa-solid fa-bell text-warning',               // Due Reminder
      40: 'fa-solid fa-bell-concierge text-warning-emphasis', // Due First Chaseup
      50: 'fa-solid fa-bell-slash text-danger-emphasis', // Due Second Chaseup

      [-1]: 'fa-solid fa-triangle-exclamation text-danger' // Overdue
    };

    return map[statusId] ?? 'fa-regular fa-circle text-dark';
  }



  subToFilterParams() {
    this._route.queryParams
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (params: JobSearchParams) => {
          if (!GeneralService.isEmpty(params)) {
            this.filterParams.set(
              {
                ...params,
                page: +params['page'] || 1,
                statusId: +params['statusId'] || 0,
                region: +params['region'] || 0,
                active: (+params['active'] === 0 || +params['active'] === 1) ? +params['active'] : null,
                pageSize: 20
              }
            )

            this.getJobsList(this.filterParams());
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
