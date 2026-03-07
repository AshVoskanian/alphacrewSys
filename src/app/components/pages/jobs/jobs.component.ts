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
import { JobsFilterComponent } from "./jobs-filter/jobs-filter.component";
import { Job, JobDetails, JobResponse, JobSearchParams } from "../../../shared/interface/jobs";
import { AddJobComponent } from "./add-job/add-job.component";
import { CurrencyPipe } from "@angular/common";

@Component({
  selector: 'app-jobs',
  imports: [ CardComponent, TableComponent, Select2Module, NgxPaginationModule, JobsFilterComponent, AddJobComponent ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
  providers: [ CurrencyPipe ]
})
export class JobsComponent extends ApiBase implements OnInit {
  private _router: Router = inject(Router);
  private _dr = inject(DestroyRef);
  private _modal = inject(NgbModal);
  private _currency = inject(CurrencyPipe);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _sanitizer: DomSanitizer = inject(DomSanitizer);

  loading: WritableSignal<boolean> = signal(false);
  totalCount: WritableSignal<number> = signal<number>(null);
  filterParams: WritableSignal<JobSearchParams> = signal({ page: 1, pageSize: 20 });

  public tableConfig: TableConfigs = {
    columns: [
      { title: '', field_value: 'jobId' },
      { title: 'Company/Venue', field_value: 'company_venue', sort: true, type: 'action' },
      { title: 'Status', field_value: 'statusText', sort: true },
      { title: '', field_value: 'statusContent' },
      { title: 'Region', field_value: 'regionText', sort: true },
      { title: 'Parts', field_value: 'parts' },
      { title: 'Start', field_value: 'starts', type: 'date' },
      { title: 'End', field_value: 'ends', type: 'date' },
      { title: 'Hours', field_value: 'totalHours' },
      { title: 'Cost', field_value: 'cost', class: 'text-end p-r-10' },
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
            company_venue: `
              <p class="m-0 text-black">${ job.companyName }</p>
              <p class="m-0 text-gray">@ ${ job.venueName }</p>
            `,
            statusText: this._sanitizer.bypassSecurityTrustHtml(
              `<p class="m-0 text-center p-x-5 rounded" style="background: ${job.statusColour}; color: #000   ">${job.statusText}</p>
                     <p class="m-0 text-nowrap text-center" style="color: ${job.requiresPO && !job.purchaseOrder ? 'red' : 'black'}">${job.requiresPO && !job.purchaseOrder ? '(PO Required)' : (job.purchaseOrder || '')}</p>`
            ),
            cost: this._currency.transform(job.cost, 'GBP', 'symbol', '1.2-2')
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
        next: (params: JobSearchParams) => {
          if (!GeneralService.isEmpty(params)) {
            this.filterParams.set(
              {
                ...params,
                page: +params['page'] || 1,
                statusId: +params['statusId'] || 0,
                region: +params['region'] || 0,
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
    }).then();
  }

  itemSelect(job: JobDetails) {
    this._router.navigate([ 'jobs', job.jobId ]).then();
  }

  addNewClient(temp: TemplateRef<NgbModal>) {
    this.modalRef = this._modal.open(temp, { centered: true, size: 'xl' })
  }

  goToCreatedClientDetails(job: JobDetails) {
    this.modalRef.close();
    this._router.navigate([ 'jobs', job?.jobId ]).then();
  }
}
