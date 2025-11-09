import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Editor, NgxEditorModule } from "ngx-editor";
import { Select2Module } from "ng-select2-component";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { GeneralService } from "../../../../../../shared/services/general.service";
import { CrewPayment } from "../../../../../../shared/interface/crew";

@Component({
  selector: 'app-payment-add-update',
  imports: [
    NgxEditorModule,
    Select2Module,
    ClipboardModule,
  ],
  templateUrl: './payment-add-update.component.html',
  styleUrl: './payment-add-update.component.scss'
})
export class PaymentAddUpdateComponent implements OnInit {
  @Output() closeModal: EventEmitter<{
    payDate: string,
    payAmount: number,
    comments: string
  } | null> = new EventEmitter<{
    payDate: string,
    payAmount: number,
    comments: string
  } | null>();

  @Input() loading: boolean = false;
  @Input() selectedPayment: CrewPayment;

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
    const payDate = this.selectedPayment?.payDate.split('T')[0];

    this.form = new FormGroup({
      payDate: new FormControl(payDate, Validators.required),
      payAmount: new FormControl(this.selectedPayment?.payAmount, Validators.required),
      comments: new FormControl(this.selectedPayment?.comments || '', Validators.required),
    })
  }

  save() {
    this.closeModal.emit({
      payDate: this.form.get('payDate').value,
      payAmount: this.form.get('payAmount').value,
      comments: GeneralService.stripHtmlTags(this.form.get('comments').value),
    });
  }
}
