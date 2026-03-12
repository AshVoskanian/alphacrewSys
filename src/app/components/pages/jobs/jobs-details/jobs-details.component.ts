import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Location } from "@angular/common";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { LayoutService } from "../../../../shared/services/layout.service";
import { ApiBase } from "../../../../shared/bases/api-base";
import { GeneralService } from "../../../../shared/services/general.service";
import { EditJobComponent } from "../edit-job/edit-job.component";
import { AddPaymentResponse, JobDetails, JobPartRateCard, JobScheduleWarning } from "../../../../shared/interface/jobs";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-jobs-details',
  imports: [
    CardComponent,
    RouterModule,
    EditJobComponent,
    NgbTooltip,
  ],
  templateUrl: './jobs-details.component.html',
  styleUrl: './jobs-details.component.scss'
})
export class JobsDetailsComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _location: Location = inject(Location);
  private _route: ActivatedRoute = inject(ActivatedRoute);

  public layoutService = inject(LayoutService);

  jobRateCard: WritableSignal<JobPartRateCard> = signal(null);
  jobDetails: WritableSignal<JobDetails> = signal<JobDetails>(null);
  jobWarnings: WritableSignal<JobScheduleWarning[]> = signal<JobScheduleWarning[]>(null);

  ngOnInit() {
    this.getDetails();
    this.getRateCards();
  }

  getDetails() {
    this.layoutService.loading = true;

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<JobDetails>(`Jobs/GetJobByJobId?jobId=${ +params.get('id') }`)
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

                this.jobDetails.set(res.data);
                this.getJobPartWarnings();
              }
            })
        }
      })
  }

  getJobPartWarnings() {
    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<JobScheduleWarning[]>(`Jobs/GetJobPartWarning?jobId=${ +params.get('id') }`)
            .pipe(
              takeUntilDestroyed(this._dr)
            )
            .subscribe({
              next: res => {
                if (res.errors && res.errors.errorCode) {
                  GeneralService.showErrorMessage(res.errors.message);
                  return;
                }
                this.jobWarnings.set(res.data);
              }
            })
        }
      })
  }

  getRateCards() {
    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<JobPartRateCard>(`Jobs/GetRateCard?jobId=${ +params.get('id') }`)
            .pipe(
              takeUntilDestroyed(this._dr)
            )
            .subscribe({
              next: res => {
                if (res.errors && res.errors.errorCode) {
                  GeneralService.showErrorMessage(res.errors.message);
                  return;
                }

                this.jobRateCard.set(res.data);
              }
            })
        }
      })
  }

  goBack() {
    this._location.back();
  }

  onPartialPaymentsUpdated(data: AddPaymentResponse) {
    this.jobDetails.update(details => {
      if (!details) return details;
      return {
        ...details,
        partialPayments: data.partialPayments ?? details.partialPayments,
        ...(data.jobCost != null && { jobCost: data.jobCost })
      };
    });
  }
}
