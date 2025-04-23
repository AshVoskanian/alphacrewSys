import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Select2Data, Select2Module } from "ng-select2-component";
import { FormBuilder, FormGroup } from "@angular/forms";
import { JobPartCrewEdit } from "../../../../../shared/interface/schedule";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-edit',
  imports: [ Select2Module, CommonModule ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  providers: [ NgbActiveModal ]
})
export class EditComponent implements OnInit {
  @Input() crewInfo?: JobPartCrewEdit;
  @Output() closeModal: EventEmitter<boolean> = new EventEmitter<boolean>();

  private readonly _fb: FormBuilder = inject(FormBuilder);

  form!: FormGroup;

  lateNightShift: number = 0;
  oot: number = 0;
  travel: number = 0;

  roles: Select2Data = [
    {
      label: 'Crew',
      value: 1
    },
    {
      label: 'CrewChief',
      value: 2
    },
    {
      label: 'TeamLead',
      value: 4
    },
    {
      label: 'Skilled',
      value: 3
    }
  ]

  statuses: Select2Data = [
    {
      label: 'Assigned',
      value: 1
    },
    {
      label: 'Unassigned',
      value: 0
    },
    {
      label: 'Confirmed',
      value: 2
    },
    {
      label: 'Reject',
      value: 3
    },
    {
      label: 'Notified',
      value: 5
    },
    {
      label: 'No Show',
      value: 6
    }
  ]

  filledCheckbox = [
    {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1234'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1234567'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345678'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1234567890'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345678907'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345678907'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789076r'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789076re'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789076rew'
    }

  ]

  ngOnInit() {
    this.initForm();
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
}
