import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Editor, NgxEditorModule } from "ngx-editor";
import { Select2Module } from "ng-select2-component";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CrewAdjustment } from "../../../../../../shared/interface/crew";
import { GeneralService } from "../../../../../../shared/services/general.service";

@Component({
  selector: 'app-deduction-add-update',
  imports: [
    NgxEditorModule,
    Select2Module,
    ClipboardModule,
  ],
  templateUrl: './deduction-add-update.component.html',
  styleUrl: './deduction-add-update.component.scss'
})
export class DeductionAddUpdateComponent implements OnInit {
  @Output() closeModal: EventEmitter<{
    adjustmentDate: string,
    amount: number,
    description: string
  } | null> = new EventEmitter();

  @Input() loading: boolean = false;
  @Input() selectedPayment: CrewAdjustment;

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
    const payDate = this.selectedPayment?.adjustmentDate.split('T')[0];

    this.form = new FormGroup({
      adjustmentDate: new FormControl(payDate, Validators.required),
      amount: new FormControl(this.selectedPayment?.amount, Validators.required),
      description: new FormControl(this.selectedPayment?.description || '', Validators.required),
    })
  }

  save() {
    this.closeModal.emit({
      ...this.form.getRawValue(),
      description: GeneralService.stripHtmlTags(this.form.get('description').value),
    });
  }
}
