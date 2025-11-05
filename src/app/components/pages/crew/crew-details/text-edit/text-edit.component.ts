import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Editor, NgxEditorModule } from "ngx-editor";
import { GeneralService } from "../../../../../shared/services/general.service";
import { Select2Module } from "ng-select2-component";
import { ClipboardModule } from "@angular/cdk/clipboard";

@Component({
  selector: 'app-text-edit',
  imports: [
    NgxEditorModule,
    Select2Module,
    ClipboardModule,
  ],
  templateUrl: './text-edit.component.html',
  styleUrl: './text-edit.component.scss'
})
export class TextEditComponent implements OnInit {
  @Input() loading: boolean = false;
  @Input() text: string = '';
  @Output() closeModal: EventEmitter<string | null> = new EventEmitter<string | null>();

  public editor: Editor;

  ngOnInit() {
    this.initEditor();
  }

  initEditor() {
    this.editor = new Editor();
  }

  save() {
    this.closeModal.emit(GeneralService.stripHtmlTags(this.text));
  }
}
