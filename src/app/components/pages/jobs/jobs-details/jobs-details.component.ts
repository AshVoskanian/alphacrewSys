import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Location } from "@angular/common";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { LayoutService } from "../../../../shared/services/layout.service";
import { ApiBase } from "../../../../shared/bases/api-base";
import { GeneralService } from "../../../../shared/services/general.service";
import { ClientDetails } from "../../../../shared/interface/clients";

@Component({
  selector: 'app-jobs-details',
  imports: [
    CardComponent,
    RouterModule,
  ],
  templateUrl: './jobs-details.component.html',
  styleUrl: './jobs-details.component.scss'
})
export class JobsDetailsComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _location: Location = inject(Location);
  private _route: ActivatedRoute = inject(ActivatedRoute);

  public layoutService = inject(LayoutService);

  clientDetails: WritableSignal<ClientDetails> = signal<ClientDetails>(null);

  ngOnInit() {
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
              }
            })
        }
      })
  }

  goBack() {
    this._location.back();
  }
}
