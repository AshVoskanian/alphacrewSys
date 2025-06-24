import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Select2Data, Select2Module } from "ng-select2-component";
import { FormBuilder, FormGroup } from "@angular/forms";
import { BonusResponse, CrewSkill, JobPartCrewEdit, Schedule } from "../../../../../shared/interface/schedule";
import { CommonModule } from "@angular/common";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FeatherIconComponent } from "../../../../../shared/components/ui/feather-icon/feather-icon.component";
import { ROLES, SKILLS, STATUSES } from "../../../../../shared/data/schedule";
import { GeneralService } from "../../../../../shared/services/general.service";
import { ScheduleService } from "../../schedule.service";

@Component({
  selector: 'app-edit',
  imports: [ Select2Module, CommonModule, FeatherIconComponent ],
  templateUrl: './edit.component.html',
  standalone: true,
  styleUrl: './edit.component.scss'
})
export class EditComponent extends ApiBase implements OnInit {
  @Input() crewInfo?: JobPartCrewEdit;
  @Input() scheduleInfo?: Schedule;
  @Output() closeModal: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() finish: EventEmitter<Schedule> = new EventEmitter<Schedule>();

  private readonly _dr: DestroyRef = inject(DestroyRef);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _scheduleService = inject(ScheduleService);

  form!: FormGroup;

  pay: number = 0;

  loading: boolean = false;
  saveLoading: boolean = false;
  bonusActionType: 'REMOVE' | 'APPLY';

  skills: Array<CrewSkill> = SKILLS;

  roles: Select2Data = ROLES;

  statuses: Select2Data = STATUSES;

  ngOnInit() {
    this.initForm();
    this.setCrewSkills();
    this.pay = this.crewInfo.pay;
  }

  initForm() {
    this.form = this._fb.group({
      expences: [ this.crewInfo?.expences || 0 ],
      extraHours: [ this.crewInfo?.extraHours || 0 ],
      jobPartCrewRoleId: [ this.crewInfo?.jobPartCrewRoleId || 0 ],
      jobPartCrewStatusId: [ this.crewInfo?.jobPartCrewStatusId || 0 ],
      lastMinuteBonus: [ this.crewInfo?.lastMinuteBonus || 0 ],
      otherPaymentAdjustment: [ this.crewInfo?.otherPaymentAdjustment || 0 ],
      otherPaymentAdjustmentTxt: [ this.crewInfo?.otherPaymentAdjustmentTxt || '' ],
      skilledCost: [ this.crewInfo?.skilledCost || 0 ],
    });
  }

  setCrewSkills() {
    const crewSkillIds: number[] = this.crewInfo.jobPartSkills.map(it => it.crewSkillId);
    this.skills.forEach(it => it.checked = crewSkillIds.includes(it.crewSkillId));
  }

  bonusAction(type: 'REMOVE' | 'APPLY') {
    if (this.loading || (type === 'REMOVE' && (this.crewInfo.bonus === 0 || !this.crewInfo.bonus))) return;

    this.bonusActionType = type;

    if (type === 'APPLY') {
      this.applyBonus();
    }

    if (type === 'REMOVE') {
      this.removeBonus();
    }
  }

  applyBonus() {
    this.loading = true;
    this.post<BonusResponse>('Schedule/AddOrUpdateJobPartCrewBonus', { jobPartCrewId: this.crewInfo.jobPartCrewId })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.loading = false;

          if (res.errors?.errorCode) {
            return;
          }

          this.crewInfo.bonus = res.data?.bonus;
          this.pay = res.data?.pay;
        }
      })
  }

  removeBonus() {
    this.loading = true;
    this.post<BonusResponse>('Schedule/RemoveJobPartCrewBonus', { jobPartCrewId: this.crewInfo.jobPartCrewId })
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.loading = false;

          if (res.errors?.errorCode) {
            return;
          }

          this.crewInfo.bonus = res.data?.bonus;
          this.pay = res.data?.pay;
        }
      })
  }

  save() {
    if (this.saveLoading) return;

    this.saveLoading = true;

    const data = {
      jobPartId: this.scheduleInfo.jobPartId,
      jobPartCrewId: this.crewInfo.jobPartCrewId,
      drivingBonus: this.form.get('expences').value,
      extraHours: this.form.get('extraHours').value,
      otherPaymentAdjustment: this.form.get('otherPaymentAdjustment').value,
      skilledCost: this.form.get('skilledCost').value,
      otherPaymentAdjustmentTxt: this.form.get('otherPaymentAdjustmentTxt').value,
      lastMinuteBonus: this.form.get('lastMinuteBonus').value,
      jobPartCrewStatusId: this.form.get('jobPartCrewStatusId').value,
      jobPartCrewRoleId: this.form.get('jobPartCrewRoleId').value,
      skillId: this.skills.filter(it => it.checked).map(it => it.crewSkillId)
    }


    this.post<Schedule>('Schedule/jobpartcrewedit', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.saveLoading = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage();
          this._scheduleService.crewUpdate$.next([ res.data ]);
          this.finish.emit(res.data);
        }
      })
  }
}
