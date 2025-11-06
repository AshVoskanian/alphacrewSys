import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Editor, NgxEditorModule } from "ngx-editor";
import { Select2Module } from "ng-select2-component";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { GeneralService } from "../../../../../../shared/services/general.service";
import { CrewHoliday } from "../../../../../../shared/interface/crew";

@Component({
  selector: 'app-holiday-add-update',
  imports: [
    NgxEditorModule,
    Select2Module,
    ClipboardModule,
  ],
  templateUrl: './holiday-add-update.component.html',
  styleUrl: './holiday-add-update.component.scss'
})
export class HolidayAddUpdateComponent implements OnInit {
  @Output() closeModal: EventEmitter<{
    startDate: string,
    endDate: string,
    comment: string
  } | null> = new EventEmitter<{
    startDate: string,
    endDate: string,
    comment: string
  } | null>();

  @Input() loading: boolean = false;
  @Input() selectedHoliday: CrewHoliday;

  public editor: Editor;
  public form: FormGroup;

  ngOnInit() {
    this.initForm();
    this.initEditor();
  }

  initEditor() {
    this.editor = new Editor();
  }

  initForm() {
    const endDate = this.selectedHoliday?.holidayEnd.split('T')[0];
    const startDate = this.selectedHoliday?.holidayStart.split('T')[0];

    this.form = new FormGroup({
      endDate: new FormControl(endDate, Validators.required),
      startDate: new FormControl(startDate, Validators.required),
      comment: new FormControl(this.selectedHoliday?.comments || '', Validators.required),
    })
  }

  save() {
    this.closeModal.emit({
      startDate: this.form.get('startDate').value,
      endDate: this.form.get('endDate').value,
      comment: GeneralService.stripHtmlTags(this.form.get('comment').value),
    });
  }
}
