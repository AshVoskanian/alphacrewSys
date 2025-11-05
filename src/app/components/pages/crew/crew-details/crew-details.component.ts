import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { finalize } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { LayoutService } from "../../../../shared/services/layout.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CrewDetail } from "../../../../shared/interface/crew";
import { ApiBase } from "../../../../shared/bases/api-base";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { TransformedSkill } from "../../../../shared/interface/schedule";
import { CREW_SKILLS } from "../../../../shared/data/skills";
import { DatePipe, NgOptimizedImage, TitleCasePipe } from "@angular/common";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { CrewProfileComponent } from "./crew-profile/crew-profile.component";
import { GeneralService } from "../../../../shared/services/general.service";
import { FormsModule } from "@angular/forms";
import { CrewNotesComponent } from "./crew-notes/crew-notes.component";
import { CrewDocumentsComponent } from "./crew-documents/crew-documents.component";
import { CrewDeductionsComponent } from "./crew-deductions/crew-deductions.component";
import { CrewFeedbackComponent } from "./crew-feedback/crew-feedback.component";
import { CrewTimesheetsComponent } from "./crew-timesheets/crew-timesheets.component";
import { CrewPaymentsComponent } from "./crew-payments/crew-payments.component";
import { CrewHolidaysComponent } from "./crew-holidays/crew-holidays.component";

@Component({
  selector: 'app-crew-details',
  imports: [
    CardComponent,
    TitleCasePipe,
    NgbNavModule,
    CrewProfileComponent,
    DatePipe,
    FormsModule,
    NgOptimizedImage,
    CrewNotesComponent,
    CrewDocumentsComponent,
    CrewDeductionsComponent,
    CrewFeedbackComponent,
    CrewTimesheetsComponent,
    CrewPaymentsComponent,
    CrewHolidaysComponent
  ],
  templateUrl: './crew-details.component.html',
  styleUrl: './crew-details.component.scss'
})
export class CrewDetailsComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  public layoutService = inject(LayoutService);

  crewDetails: WritableSignal<CrewDetail> = signal<CrewDetail>(null);
  profileLoading: WritableSignal<boolean> = signal<boolean>(false);
  skills: WritableSignal<TransformedSkill[]> = signal<TransformedSkill[]>(null);

  activeTab: string = 'notes';

  ngOnInit() {
    this.getDetails();
  }

  getDetails() {
    this.layoutService.loading = true;

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<CrewDetail>(`/Crew/GetCrewByCrewId?crewId=${ +params.get('id') }`)
          // this.get<CrewDetail>(`/Crew/GetCrewByCrewId?crewId=${ +params.get('id') }`)
            .pipe(
              takeUntilDestroyed(this._dr),
              finalize(() => this.layoutService.loading = false)
            )
            .subscribe({
              next: res => {
                this.crewDetails.set(res.data);
                this.setSkills(res.data);
              }
            })
        }
      })
  }

  setSkills(crewDetails: CrewDetail) {
    this.skills.set([]);

    crewDetails.crewAllSkills.forEach(skill => {
      this.skills().push({
        name: skill.name,
        url: CREW_SKILLS[skill.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')],
        active: skill.isActive,
        id: skill.id
      })
    })
  }

  saveCrewProfile(crewData: any) {
    if (this.profileLoading()) return;

    const crewSkillIds = this.skills().filter(it => it.active).map(it => it.id);

    this.profileLoading.set(true);

    this.post<CrewDetail>('Crew/AddOrUpdateCrew', {
      ...crewData,
      crewSkillIds,
    })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.profileLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.crewDetails.set(res.data);

          GeneralService.showSuccessMessage();
        }
      })
  }
}
