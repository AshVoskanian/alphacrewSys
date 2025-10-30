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
import { DatePipe, TitleCasePipe } from "@angular/common";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { CrewProfileComponent } from "./crew-profile/crew-profile.component";

@Component({
  selector: 'app-crew-details',
  imports: [ CardComponent, TitleCasePipe, NgbNavModule, CrewProfileComponent, DatePipe ],
  templateUrl: './crew-details.component.html',
  styleUrl: './crew-details.component.scss'
})
export class CrewDetailsComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _layoutService = inject(LayoutService);

  crewDetails: WritableSignal<CrewDetail> = signal<CrewDetail>(null);
  skills: WritableSignal<TransformedSkill[]> = signal<TransformedSkill[]>(null);

  activeTab: string = 'profile';

  ngOnInit() {
    this.getDetails();
  }

  getDetails() {
    this._layoutService.loading = true;

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<CrewDetail>(`Crew/GetCrewByCrewId?crewId=8`)
            // this.get<CrewDetail>(`/Crew/GetCrewByCrewId?crewId=${ +params.get('id') }`)
            .pipe(
              takeUntilDestroyed(this._dr),
              finalize(() => this._layoutService.loading = false)
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
        active: skill.isActive
      })
    })
  }
}
