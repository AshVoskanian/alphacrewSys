import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Select2Data, Select2Module } from "ng-select2-component";
import { JOB_STATUSES } from "../../../../components/pages/jobs/jobs-filter/jobs-utils";

@Component({
  selector: 'app-multi-chip',
  imports: [
    ReactiveFormsModule,
    Select2Module
  ],
  templateUrl: './multi-chip.component.html',
  styleUrl: './multi-chip.component.scss'
})
export class MultiChipComponent implements OnInit {
  private _fb = inject(FormBuilder);

  form: FormGroup;

  statuses: WritableSignal<Select2Data> = signal<Select2Data>(JOB_STATUSES);

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this._fb.group({
      chipItem: [ '' ]
    });
  }
}
