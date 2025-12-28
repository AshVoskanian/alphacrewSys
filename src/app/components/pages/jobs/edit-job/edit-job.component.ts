import { Component, DestroyRef, inject, input, OnInit, signal, WritableSignal } from '@angular/core';
import { JobDetails } from "../../../../shared/interface/jobs";
import { NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { JOB_STATUSES } from "../jobs-filter/jobs-utils";

@Component({
  selector: 'app-edit-job',
  imports: [
    NgbTypeahead,
    ReactiveFormsModule,
    Select2Module
  ],
  templateUrl: './edit-job.component.html',
  styleUrl: './edit-job.component.scss'
})
export class EditJobComponent implements OnInit {

  jobDetails = input<JobDetails>();

  private readonly _dr = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);

  statuses: WritableSignal<Select2Option[]> = signal<Select2Option[]>(JOB_STATUSES);

  loading = signal<boolean>(false);

  form: FormGroup;

  ngOnInit() {
    this.initForm()
  }

  initForm() {
    this.form = this._fb.group({
      statusId: [ 0, [ Validators.required ] ],
      jobRegionId: [ 0, [ Validators.required ] ],
      clientId: [ null, [ Validators.required ] ],
      venueId: [ null ],
      venue: [ null, [ Validators.required ] ],
      showAllVenues: [ false, [ Validators.required ] ],
    });
  }

  submit() {

  }
}
