import { Component, DestroyRef, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Location } from "@angular/common";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { ClientsFormComponent } from "../clients-form/clients-form.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { LayoutService } from "../../../../shared/services/layout.service";
import { ApiBase } from "../../../../shared/bases/api-base";
import { GeneralService } from "../../../../shared/services/general.service";
import { ClientDetails } from "../../../../shared/interface/clients";
import { BreadcrumbService } from "../../../../shared/services/breadcrumb.service";

@Component({
  selector: 'app-clients-details',
  imports: [
    CardComponent,
    RouterModule,
    ClientsFormComponent,
  ],
  templateUrl: './clients-details.component.html',
  styleUrl: './clients-details.component.scss'
})
export class ClientsDetailsComponent extends ApiBase implements OnInit, OnDestroy {
  private _dr: DestroyRef = inject(DestroyRef);
  private _location: Location = inject(Location);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _breadcrumbService = inject(BreadcrumbService);

  public layoutService = inject(LayoutService);

  clientDetails: WritableSignal<ClientDetails> = signal<ClientDetails>(null);

  ngOnInit() {
    this._breadcrumbService.setDetailLabel(null);
    this.getDetails();
  }

  getDetails() {
    this.layoutService.loading = true;

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<ClientDetails>(`Clients/GetClientByClientId?clientID=${ +params.get('id') }`)
            .pipe(
              takeUntilDestroyed(this._dr),
              finalize(() => this.layoutService.loading = false)
            )
            .subscribe({
              next: res => {
                if (res.errors && res.errors.errorCode) {
                  GeneralService.showErrorMessage(res.errors.message);
                  return;
                }

                this.clientDetails.set(res.data);
                this._breadcrumbService.setDetailLabel(res.data?.companyName ?? null);
              }
            })
        }
      })
  }

  ngOnDestroy(): void {
    this._breadcrumbService.setDetailLabel(null);
  }

  goBack() {
    this._location.back();
  }
}
