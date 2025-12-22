import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Location } from "@angular/common";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { VenueFormComponent } from "../venue-form/venue-form.component";
import { VenueDetails } from "../../../../shared/interface/venue";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { LayoutService } from "../../../../shared/services/layout.service";
import { ApiBase } from "../../../../shared/bases/api-base";
import { GeneralService } from "../../../../shared/services/general.service";

@Component({
  selector: 'app-venue-details',
  imports: [
    CardComponent,
    RouterModule,
    VenueFormComponent
  ],
  templateUrl: './venue-details.component.html',
  styleUrl: './venue-details.component.scss'
})
export class VenueDetailsComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _location: Location = inject(Location);
  private _route: ActivatedRoute = inject(ActivatedRoute);

  public layoutService = inject(LayoutService);

  venueDetails: WritableSignal<VenueDetails> = signal<VenueDetails>(null);

  ngOnInit() {
    this.getDetails();
  }

  getDetails() {
    this.layoutService.loading = true;

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<VenueDetails>(`Venues/GetVenueByVenueId?venueId=${ +params.get('id') }`)
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

                this.venueDetails.set(res.data);
              }
            })
        }
      })
  }

  goBack() {
    this._location.back();
  }
}
