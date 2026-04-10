import { Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { Select2Data, Select2Module, Select2Option } from "ng-select2-component";
import { ApiBase } from "../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CrewSearchParams } from "../../../../shared/interface/crew";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { GeneralService } from "../../../../shared/services/general.service";
import { finalize } from "rxjs";
import { RegionsService } from "../../../../shared/services/regions.service";
import { JOB_STATUSES } from "./jobs-utils";
import { JobSearchParams } from "../../../../shared/interface/jobs";

@Component({
  selector: 'app-jobs-filter',
  imports: [
    Select2Module
  ],
  templateUrl: './jobs-filter.component.html',
  styleUrl: './jobs-filter.component.scss'
})
export class JobsFilterComponent extends ApiBase implements OnInit {
  @Output() public filter: EventEmitter<CrewSearchParams> = new EventEmitter();

  private _router: Router = inject(Router);
  private _dr = inject(DestroyRef);
  private _fb = inject(FormBuilder);
  private _regionsService = inject(RegionsService);
  private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  form: FormGroup;

  loading: WritableSignal<boolean> = signal<boolean>(false);
  regions = signal<Select2Option[]>([]);
  statuses: WritableSignal<Select2Data> = signal<Select2Data>(JOB_STATUSES);

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this._fb.group({
      searchKey: [ '' ],
      statusId: [ 0 ],
      region: [ 0 ]
    });

    this.subToRegions();
  }

  subToRegions() {
    this._regionsService.regions.pipe(
      takeUntilDestroyed(this._dr),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: regions => {
        this.regions.set(regions);

        setTimeout(() => this.setExistingParams(), 100);
      }
    })
  }

  setExistingParams() {
    this._activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(params => {
        if (!GeneralService.isEmpty(params)) {
          const transformedParams: JobSearchParams = {
            ...params,
            page: +params['page'] || 1,
            statusId: +params['statusId'] || 0,
            region: +params['region'] || 0
          }
          if (Object.keys(transformedParams).length) {
            this.form.patchValue(transformedParams, { emitEvent: false });
          }
        } else {
          this.submit();
        }
      });
  }

  submit() {
    this._router.navigate([], {
      relativeTo: this._activatedRoute,
      queryParams: {
        ...this.form.getRawValue(),
        page: 1
      }
    }).then();
  }
}
