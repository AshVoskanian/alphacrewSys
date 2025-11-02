import { Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { Select2Data, Select2Module } from "ng-select2-component";
import { ApiBase } from "../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CrewSearchParams, FilterDropdowns } from "../../../../shared/interface/crew";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CrewService } from "../crew.service";

@Component({
  selector: 'app-crew-filter',
  imports: [
    Select2Module
  ],
  templateUrl: './crew-filter.component.html',
  styleUrl: './crew-filter.component.scss'
})
export class CrewFilterComponent extends ApiBase implements OnInit {
  @Output() public filter: EventEmitter<CrewSearchParams> = new EventEmitter();

  private _router: Router = inject(Router);
  private _dr = inject(DestroyRef);
  private _fb = inject(FormBuilder);
  private _crewService = inject(CrewService);
  private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  form: FormGroup;

  loading: WritableSignal<boolean> = signal<boolean>(false);
  dropdowns: WritableSignal<FilterDropdowns> = signal<FilterDropdowns>(null);
  statuses: WritableSignal<Select2Data> = signal<Select2Data>([
    {
      label: 'All',
      value: null,
    },
    {
      label: 'Active',
      value: 1
    },
    {
      label: 'Inactive',
      value: 0
    }
  ]);

  ngOnInit() {
    this.getDropdownsData();
    this.initForm();
  }

  initForm() {
    this.form = this._fb.group({
      searchKey: [ '' ],
      acive: [ null ],
      crewLevel: [ 0 ],
      crewRegion: [ 0 ],
      paymentOption: [ 0 ],
      classification: [ 0 ],
    });
  }

  setExistingParams() {
    this._activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(params => {
        const transformedParams = {
          ...params,
          page: +params['page'] || 1,
          classification: +params['classification'] || 0,
          crewLevel: +params['crewLevel'] || 0,
          crewRegion: +params['crewRegion'] || 0,
          paymentOption: +params['paymentOption'] || 0,
          acive: +params['acive'] || null,
        }
        if (Object.keys(transformedParams).length) {
          this.form.patchValue(transformedParams, { emitEvent: false });
        }
      });
  }

  getDropdownsData() {
    this.loading.set(true);

    this._crewService.getDropdownsData()
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.dropdowns.set(res.data);
          this.loading.set(false);
          this.setExistingParams();
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
