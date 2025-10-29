import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CrewService } from "../crew.service";
import { finalize } from "rxjs";
import { AsyncPipe, JsonPipe } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { LayoutService } from "../../../../shared/services/layout.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-crew-details',
  imports: [
    AsyncPipe,
    JsonPipe
  ],
  templateUrl: './crew-details.component.html',
  styleUrl: './crew-details.component.scss'
})
export class CrewDetailsComponent implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _crewService: CrewService = inject(CrewService);
  private _layoutService = inject(LayoutService);

  crewDetails = signal(null);

  ngOnInit() {
    this.getDetails();
  }

  getDetails() {
    this._layoutService.loading = true;

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this._crewService.getDetail(+params.get('id'))
            .pipe(
              takeUntilDestroyed(this._dr),
              finalize(() => this._layoutService.loading = false)
            )
            .subscribe({
              next: res => {
                console.log(res)
                this.crewDetails.set(res);
              }
            })
        }
      })
  }
}
