import { Component, DestroyRef, inject, input, OnChanges, OnInit, output, signal, SimpleChanges } from '@angular/core';
import { Select2Module } from "ng-select2-component";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CrewDetail, FilterDropdowns } from "../../../../../shared/interface/crew";
import { CrewService } from "../../crew.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DatePipe } from "@angular/common";
import { GeneralService } from "../../../../../shared/services/general.service";

@Component({
  selector: 'app-crew-profile',
  imports: [ Select2Module ],
  templateUrl: './crew-profile.component.html',
  styleUrl: './crew-profile.component.scss',
  providers: [ DatePipe ]
})
export class CrewProfileComponent implements OnInit, OnChanges {
  private readonly _date = inject(DatePipe);
  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private readonly _crewService = inject(CrewService);

  save = output<any>();

  crewDetail = input<CrewDetail>();
  loading = input<boolean>(false);

  dropdowns = signal<FilterDropdowns>(null);

  form: FormGroup;

  ngOnInit() {
    this.initForm();
    this.getDropdowns();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getDropdowns(changes['crewDetail'].currentValue);
    }
  }

  initForm() {
    this.form = this._fb.group({
      name: [ '', [ Validators.required ] ],
      phoneNumber: [ '', [ Validators.required ] ],
      email: [ '', [ Validators.required, Validators.email ] ],
      login: [ '' ],
      password: [ '' ],
      deactivationDate: [ '' ],
      loyaltyBonus: [ '' ],
      jobNotes: [ '' ],
      startDate: [ '', [ Validators.required ] ],
      postcode: [ '', [ Validators.required ] ],
      address: [ '', [ Validators.required ] ],
      isActive: [ '' ],
      isFulltime: [ '' ],
      regionId: [ 1 ],
      levelId: [ '' ],
      groupId: [ '' ],
      classificationId: [ '' ],
      paymentOptionId: [ '' ],
      pliCoverId: [ '' ],
      checksId: [ '' ],
      pliExpiry: [ '' ],
      passportExpiry: [ '' ],
      visaExpiry: [ '' ],
    });
  }

  getDropdowns(data?: CrewDetail) {
    this._crewService.getDropdownsData()
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          if (res) {
            this.dropdowns.set(res.data);
            if (data) {
              setTimeout(() => this.setFormData(data), 10);
            } else {
              setTimeout(() => this.setFormDefaultValues(), 10)
            }
          }
        }
      });
  }

  setFormDefaultValues() {
    this.form.patchValue({
      regionId: 1,
      levelId: 5,
      groupId: 1,
      classificationId: 4,
      paymentOptionId: 14,
      pliCoverId: 1,
      checksId: 1,
      loyaltyBonus: 0,
      isFulltime: true,
      isActive: true,
      startDate: this._date.transform(new Date(), 'yyyy-MM-dd'),
    });
    this.form.updateValueAndValidity();
  }

  setFormData(data: CrewDetail) {
    if (!data) return;

    this.form.patchValue({
      name: data.name,
      regionId: data.regionId,
      groupId: data.groupId,
      classificationId: data.classificationId,
      login: data.login,
      password: data.password,
      jobNotes: data.jobNotes,
      address: data.address,
      postcode: data.postcode,
      phoneNumber: data.phoneNumber,
      email: data.email,
      levelId: data.levelId,
      loyaltyBonus: data.loyaltyBonus,
      paymentOptionId: data.paymentOptionId,
      isFulltime: data.isFulltime,
      isActive: data.isActive,
      deactivationDate: this._date.transform(data.deactivationDate, 'yyyy-MM-dd'),
      pliExpiry: this._date.transform(data.pliExpiry, 'yyyy-MM-dd'),
      pliCoverId: data.pliCoverId,
      startDate: this._date.transform(data.startDate, 'yyyy-MM-dd'),
      checksId: data.checksId,
      visaExpiry: this._date.transform(data.visaExpiry, 'yyyy-MM-dd'),
      passportExpiry: this._date.transform(data.passportExpiry, 'yyyy-MM-dd')
    });
    this.form.updateValueAndValidity();
  }

  submit() {
    GeneralService.markFormGroupTouched(this.form);

    if (this.form.valid) {
      this.save.emit({
        ...this.crewDetail(),
        ...this.form.getRawValue()
      });
    }
  }
}
