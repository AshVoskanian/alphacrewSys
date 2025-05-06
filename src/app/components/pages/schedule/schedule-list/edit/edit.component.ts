import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Select2Data, Select2Module } from "ng-select2-component";
import { FormBuilder, FormGroup } from "@angular/forms";
import { CrewSkill, JobPartCrewEdit } from "../../../../../shared/interface/schedule";
import { CommonModule } from "@angular/common";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FeatherIconComponent } from "../../../../../shared/components/ui/feather-icon/feather-icon.component";
import { ROLES, SKILLS, STATUSES } from "../../../../../shared/data/schedule";

@Component({
  selector: 'app-edit',
  imports: [ Select2Module, CommonModule, FeatherIconComponent ],
  templateUrl: './edit.component.html',
  standalone: true,
  styleUrl: './edit.component.scss'
})
export class EditComponent extends ApiBase implements OnInit {
  @Input() crewInfo?: JobPartCrewEdit;
  @Output() closeModal: EventEmitter<boolean> = new EventEmitter<boolean>();

  private readonly _dr: DestroyRef = inject(DestroyRef);
  private readonly _fb: FormBuilder = inject(FormBuilder);

  form!: FormGroup;

  lateNightShift: number = 0;
  oot: number = 0;
  travel: number = 0;

  loading: boolean = false;
  bonusActionType: 'REMOVE' | 'APPLY';

  skills: Array<CrewSkill> = SKILLS;

  roles: Select2Data = ROLES;

  statuses: Select2Data = STATUSES;

  ngOnInit() {
    this.initForm();
    this.setCrewSkills();
    this.setAdditionalInfo();
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

  setAdditionalInfo() {
    this.oot = (this.crewInfo.ootCost / (this.crewInfo.crewNumber + this.crewInfo.crewChiefNumber));
    this.travel = (this.crewInfo.travelHoursCost / (this.crewInfo.crewNumber + this.crewInfo.crewChiefNumber));
    this.lateNightShift = (this.crewInfo.lateShiftCost / (this.crewInfo.crewNumber + this.crewInfo.crewChiefNumber)) * 0.8;
  }

  setCrewSkills() {
    const crewSkillIds: number[] = this.crewInfo.crewSkills.map(it => it.crewSkillId);
    this.skills.forEach(it => it.checked = crewSkillIds.includes(it.crewSkillId));
  }

  bonusAction(type: 'REMOVE' | 'APPLY') {
    if (this.loading) return;

    this.bonusActionType = type;
    this.loading = true;
    const data = {
      bonus: 5,
      jobPartCrewId: this.crewInfo.jobPartCrewId
    }

    if (type === 'REMOVE') {
      delete data.bonus;
    }

    this.post('/Schedule/AddOrRemoveJobPartCrewBonus', data)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.loading = false;

          if (res.errors?.errorCode) {
            return;
          }

          this.crewInfo.bonus = type === 'REMOVE' ? 0 : 5;
        }
      })
  }
}
