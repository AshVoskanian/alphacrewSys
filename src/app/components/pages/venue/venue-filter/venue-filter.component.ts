import { Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { ApiBase } from "../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CrewSearchParams } from "../../../../shared/interface/crew";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { GeneralService } from "../../../../shared/services/general.service";
import { IconsRadio } from "../../../../shared/interface/common";

@Component({
  selector: 'app-venue-filter',
  imports: [ReactiveFormsModule],
  templateUrl: './venue-filter.component.html',
  styleUrl: './venue-filter.component.scss'
})
export class VenueFilterComponent extends ApiBase implements OnInit {
  @Output() public filter: EventEmitter<CrewSearchParams> = new EventEmitter();

  private _router: Router = inject(Router);
  private _dr = inject(DestroyRef);
  private _fb = inject(FormBuilder);
  private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  form: FormGroup;

  loading: WritableSignal<boolean> = signal<boolean>(false);
  statuses: WritableSignal<IconsRadio[]> = signal<IconsRadio[]>([
    {
      text: 'Yes',
      icon: 'fa-circle-check text-success',
      check: true,
      id: 1
    },
    {
      text: 'No',
      icon: 'fa-minus-circle text-danger',
      check: false,
      id: 0
    },
    {
      text: 'All',
      icon: 'fa-fa-list-group text-primary',
      check: false,
      id: null
    }
  ]);

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this._fb.group({
      searchKey: [ '' ],
      includeTemporary: [ 1 ],
      venueId: [ 0 ]
    });

    this.setExistingParams();
  }

  setExistingParams() {
    this._activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(params => {
        if (!GeneralService.isEmpty(params)) {
          const transformedParams = {
            ...params,
            page: +params['page'] || 1,
            venueId: 0,
            includeTemporary: (+params['includeTemporary'] === 0 || +params['includeTemporary'] === 1) ? +params['includeTemporary'] : null,
          }
          if (Object.keys(transformedParams).length) {
            this.form.patchValue(transformedParams, { emitEvent: false });
          }
        }

        this.submit();
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
