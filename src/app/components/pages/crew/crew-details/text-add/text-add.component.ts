import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Editor, NgxEditorModule } from "ngx-editor";
import { Select2Module } from "ng-select2-component";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { GeneralService } from "../../../../../shared/services/general.service";

@Component({
  selector: 'app-text-add',
  imports: [
    NgxEditorModule,
    Select2Module,
    ClipboardModule,
  ],
  templateUrl: './text-add.component.html',
  styleUrl: './text-add.component.scss'
})
export class TextAddComponent implements OnInit {
  @Output() closeModal: EventEmitter<{ date: string, note: string } | null> = new EventEmitter<{
    date: string,
    note: string
  } | null>();

  @Input() loading: boolean = false;

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
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    this.form = new FormGroup({
      date: new FormControl(formattedDate, Validators.required),
      note: new FormControl('', Validators.required),
    })
  }

  save() {
    this.closeModal.emit({
      date: this.form.get('date').value,
      note: GeneralService.stripHtmlTags(this.form.get('note').value),
    });
  }
}
