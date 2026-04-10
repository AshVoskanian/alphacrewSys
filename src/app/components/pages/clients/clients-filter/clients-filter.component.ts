import { Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { ApiBase } from "../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CrewSearchParams } from "../../../../shared/interface/crew";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { GeneralService } from "../../../../shared/services/general.service";
import { IconsRadio } from "../../../../shared/interface/common";

@Component({
  selector: 'app-clients-filter',
  imports: [ ReactiveFormsModule ],
  templateUrl: './clients-filter.component.html',
  styleUrl: './clients-filter.component.scss'
})
export class ClientsFilterComponent extends ApiBase implements OnInit {
  @Output() public filter: EventEmitter<CrewSearchParams> = new EventEmitter();

  private _router: Router = inject(Router);
  private _dr = inject(DestroyRef);
  private _fb = inject(FormBuilder);
  private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  form: FormGroup;

  loading: WritableSignal<boolean> = signal<boolean>(false);
  statuses: WritableSignal<IconsRadio[]> = signal<IconsRadio[]>([
    {
      text: 'All',
      icon: 'fa-layer-group',
      check: false,
      id: null
    },
    {
      text: 'Active',
      icon: 'fa-circle-check text-success',
      check: false,
      id: 1
    },
    {
      text: 'Inactive',
      icon: 'fa-circle-xmark text-danger',
      check: false,
      id: 0
    },
  ]);

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this._fb.group({
      searchKey: [ '' ],
      active: [ 1 ],
      clientId: [ 0 ]
    });

    this.setExistingParams();
    this.subToStatusChange();
  }

  subToStatusChange() {
    this.form.get('active').valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: _ => {
          this.submit();
        }
      })
  }

  setExistingParams() {
    this._activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe(params => {
        if (!GeneralService.isEmpty(params)) {
          const transformedParams = {
            ...params,
            page: +params['page'] || 1,
            clientId: 0,
            active: (+params['active'] === 0 || +params['active'] === 1) ? +params['active'] : null,
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
