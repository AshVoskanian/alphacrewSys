import { Component, DestroyRef, inject, input, OnChanges, OnInit, output, signal, SimpleChanges } from '@angular/core';
import { Select2Module } from "ng-select2-component";
import { FormBuilder, FormGroup } from "@angular/forms";
import { CrewDetail, FilterDropdowns } from "../../../../../shared/interface/crew";
import { CrewService } from "../../crew.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DatePipe } from "@angular/common";

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
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getDropdowns(changes['crewDetail'].currentValue);
      console.log(5555, changes['crewDetail']);
    }
  }

  initForm() {
    this.form = this._fb.group({
      name: [ '' ],
      phoneNumber: [ '' ],
      email: [ '' ],
      login: [ '' ],
      password: [ '' ],
      deactivationDate: [ '' ],
      loyaltyBonus: [ '' ],
      jobNotes: [ '' ],
      startDate: [ '' ],
      postcode: [ '' ],
      address: [ '' ],
      isActive: [ '' ],
      isFulltime: [ '' ],
      regionId: [ '' ],
      levelId: [ '' ],
      groupId: [ '' ],
      classificationId: [ '' ],
      paymentOptionId: [ '' ],
      pliCoverId: [ '' ],
      checksId: [ '' ],
      pliExpiry: [ '' ],
    });
  }

  getDropdowns(data: CrewDetail) {
    this._crewService.getDropdownsData()
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          if (res) {
            this.dropdowns.set(res.data);
            setTimeout(() => this.setFormData(data), 10)
          }
        }
      });
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
    });
    this.form.updateValueAndValidity();
  }

  submit() {
    if (this.form.valid) {
      this.save.emit({
        ...this.crewDetail(),
        ...this.form.getRawValue()
      });
    }
  }
}
