import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { finalize } from "rxjs";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { LayoutService } from "../../../../shared/services/layout.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CrewDetail } from "../../../../shared/interface/crew";
import { ApiBase } from "../../../../shared/bases/api-base";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { TransformedSkill } from "../../../../shared/interface/schedule";
import { CREW_SKILLS } from "../../../../shared/data/skills";
import { DatePipe, Location, TitleCasePipe } from "@angular/common";
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
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Component({
  selector: 'app-crew-details',
  imports: [
    CardComponent,
    TitleCasePipe,
    NgbNavModule,
    CrewProfileComponent,
    DatePipe,
    FormsModule,
    CrewNotesComponent,
    CrewDocumentsComponent,
    CrewDeductionsComponent,
    CrewFeedbackComponent,
    CrewTimesheetsComponent,
    CrewPaymentsComponent,
    CrewHolidaysComponent,
    RouterModule
  ],
  templateUrl: './crew-details.component.html',
  styleUrl: './crew-details.component.scss'
})
export class CrewDetailsComponent extends ApiBase implements OnInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private _location: Location = inject(Location);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _domSanitizer: DomSanitizer = inject(DomSanitizer);
  public layoutService = inject(LayoutService);

  avatarUrl: WritableSignal<SafeResourceUrl> = signal<string>('');

  avatarLoading: WritableSignal<boolean> = signal<boolean>(false);
  profileLoading: WritableSignal<boolean> = signal<boolean>(false);

  crewDetails: WritableSignal<CrewDetail> = signal<CrewDetail>(null);
  skills: WritableSignal<TransformedSkill[]> = signal<TransformedSkill[]>(null);

  activeTab: string = 'profile';

  ngOnInit() {
    this.getDetails();
    this.getCrewAvatar();
  }

  getDetails() {
    this.layoutService.loading = true;

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<CrewDetail>(`Crew/GetCrewByCrewId?crewId=${ +params.get('id') }`)
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

  getCrewAvatar() {
    this.avatarLoading.set(true);

    this._route.paramMap.pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: params => {
          this.get<string>(`Crew/GetCrewImage?id=${ +params.get('id') }`)
            .pipe(
              takeUntilDestroyed(this._dr),
              finalize(() => this.avatarLoading.set(false))
            )
            .subscribe({
              next: res => {
                if (res.errors?.errorCode) {
                  GeneralService.showErrorMessage(res.errors.message);
                  return;
                }
                const mime = this._detectMime(res.data);
                this.avatarUrl.set(this._domSanitizer.bypassSecurityTrustUrl(`data:${ mime };base64,${ res.data }`));
              }
            })
        }
      })
  }

  private _detectMime(base64: string): string {
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBOR')) return 'image/png';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    return 'application/octet-stream'; // default fallback
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

    const params = {
      ...crewData,
      crewSkillIds,
    }

    GeneralService.clearObject(params);

    this.post<CrewDetail>('Crew/AddOrUpdateCrew', params)
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

  goBack() {
    this._location.back();
  }

  uploadFile(e: any) {
    const file = e.target.files[0];
    const reader = new FileReader();

    this.avatarLoading.set(true);

    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const fileName = file.name;

      const payload = {
        crewId: this.crewDetails()?.crewId,
        fileName: fileName,
        fileBase64: base64
      };

      this.post('Crew/SaveImageAsync', payload)
        .pipe(
          takeUntilDestroyed(this._dr),
          finalize(() => this.avatarLoading.set(false))
        )
        .subscribe({
          next: res => {
            if (res.errors?.errorCode) {
              GeneralService.showErrorMessage(res.errors.message);
              return;
            }

            this.getCrewAvatar();
          }
        })
    };

    reader.readAsDataURL(file);
  }
}
