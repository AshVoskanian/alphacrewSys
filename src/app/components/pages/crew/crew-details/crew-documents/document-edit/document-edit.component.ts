import {
  afterNextRender,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  OnInit,
  Output,
  signal
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import {
  CrewDocumentRow,
  CrewDocumentUploadPayload
} from '../../../../../../shared/interface/crew';
import {
  buildFullFileNamePreview,
  buildSimpleFileName,
  toIsoExpireDate
} from '../document-file-name.util';

@Component({
  selector: 'app-document-edit',
  imports: [
    ReactiveFormsModule,
    Select2Module,
  ],
  templateUrl: './document-edit.component.html',
  styleUrl: './document-edit.component.scss'
})
export class DocumentEditComponent implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _injector = inject(Injector);

  @Output() closeModal: EventEmitter<CrewDocumentUploadPayload | null> = new EventEmitter();

  @Input({ required: true }) document!: CrewDocumentRow;
  @Input() loading = false;
  @Input() crewId: number | null = null;
  @Input() documentTypes: Select2Option[] = [];

  form: FormGroup;
  typeOptions = signal<Select2Option[]>([]);
  selectedFileName = signal('');
  fullFileNamePreview = signal('');

  ngOnInit(): void {
    this.initForm();
    this.initDocumentTypes();
    this.watchFullFileNamePreview();
  }

  initForm(): void {
    this.form = new FormGroup({
      // Leave null until options are bound — select2 only applies value when data exists.
      documentType: new FormControl(null, Validators.required),
      expireDate: new FormControl(this.document.expiryDate || '', Validators.required),
      fileName: new FormControl(this.document.name || '', [Validators.required, Validators.maxLength(100)]),
      file: new FormControl<File | null>(null),
    });

    this.selectedFileName.set(this.document.fileName);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.form.patchValue({ file });
    this.form.get('file')?.markAsTouched();
    this.selectedFileName.set(file?.name ?? this.document.fileName);
    this.updateFullFileNamePreview();
  }

  save(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const { documentType, expireDate, fileName, file } = this.form.getRawValue() as {
      documentType: string;
      expireDate: string;
      fileName: string;
      file: File | null;
    };

    const sourceFileName = file?.name || this.document.fileName;

    this.closeModal.emit({
      documentType,
      expireDate: toIsoExpireDate(expireDate),
      fileName: buildSimpleFileName(String(fileName), sourceFileName),
      file,
      oldFileName: this.document.fileName,
    });
  }

  private initDocumentTypes(): void {
    const options = [...this.documentTypes];
    const selectedType = this.document.documentType?.trim();

    if (selectedType) {
      const matched = options.find((option) =>
        String(option.value).toLowerCase() === selectedType.toLowerCase()
        || String(option.label).toLowerCase() === selectedType.toLowerCase()
      );

      if (!matched) {
        options.push({ value: selectedType, label: selectedType });
      }
    }

    this.typeOptions.set(options);
    this.prefillDocumentType(options);
  }

  private prefillDocumentType(options: Select2Option[]): void {
    const selectedType = this.document.documentType?.trim();
    if (!selectedType) {
      return;
    }

    const matched = options.find((option) =>
      String(option.value).toLowerCase() === selectedType.toLowerCase()
      || String(option.label).toLowerCase() === selectedType.toLowerCase()
    );

    const valueToSet = matched?.value ?? selectedType;
    const control = this.form.get('documentType');
    if (!control) {
      return;
    }

    // select2 applies selection only when _data is set; wait for the next render
    // after typeOptions signal update, then force writeValue (same-value set is skipped).
    afterNextRender(
      () => {
        control.setValue(null, { emitEvent: false });
        control.setValue(valueToSet, { emitEvent: false });
        this.updateFullFileNamePreview();
      },
      { injector: this._injector }
    );
  }

  private watchFullFileNamePreview(): void {
    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        takeUntilDestroyed(this._dr)
      )
      .subscribe(() => this.updateFullFileNamePreview());
  }

  private updateFullFileNamePreview(): void {
    const { documentType, expireDate, fileName, file } = this.form.getRawValue() as {
      documentType: string | null;
      expireDate: string;
      fileName: string;
      file: File | null;
    };

    const typedName = String(fileName ?? '').trim();
    if (!typedName) {
      this.fullFileNamePreview.set('');
      return;
    }

    const sourceFileName = file?.name || this.document.fileName;

    this.fullFileNamePreview.set(
      buildFullFileNamePreview(typedName, documentType, expireDate, sourceFileName, this.crewId)
    );
  }
}
