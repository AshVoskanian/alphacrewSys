import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ApiBase } from '../../../../../../shared/bases/api-base';
import { GeneralService } from '../../../../../../shared/services/general.service';
import {
  CrewDocumentRow,
  CrewDocumentType,
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
export class DocumentEditComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);

  @Output() closeModal: EventEmitter<CrewDocumentUploadPayload | null> = new EventEmitter();

  @Input({ required: true }) document!: CrewDocumentRow;
  @Input() loading = false;
  @Input() crewId: number | null = null;

  form: FormGroup;
  documentTypes = signal<Select2Option[]>([]);
  selectedFileName = signal('');
  fullFileNamePreview = signal('');

  constructor(http: HttpClient) {
    super(http);
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDocumentTypes();
    this.watchFullFileNamePreview();
  }

  initForm(): void {
    this.form = new FormGroup({
      documentType: new FormControl(this.document.documentType || null, Validators.required),
      expireDate: new FormControl(this.document.expiryDate || '', Validators.required),
      fileName: new FormControl(this.document.name || '', [Validators.required, Validators.maxLength(100)]),
      file: new FormControl<File | null>(null),
    });

    this.selectedFileName.set(this.document.fileName);
  }

  loadDocumentTypes(): void {
    this.get<CrewDocumentType[]>('Crew/GetDocumentTypes')
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const options = (res.data ?? []).map((item) => ({
            value: item.documentName,
            label: item.documentName,
          }));

          this.documentTypes.set(options);
          this.prefillDocumentType(options);
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to load document types');
        },
      });
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

  private prefillDocumentType(options: Select2Option[]): void {
    const selectedType = this.document.documentType?.trim();
    if (!selectedType) {
      return;
    }

    const matched = options.find((option) =>
      String(option.value).toLowerCase() === selectedType.toLowerCase()
      || String(option.label).toLowerCase() === selectedType.toLowerCase()
    );

    if (!matched) {
      this.documentTypes.set([
        ...options,
        { value: selectedType, label: selectedType },
      ]);
    }

    const valueToSet = matched?.value ?? selectedType;

    setTimeout(() => {
      this.form.get('documentType')?.setValue(valueToSet);
      this.updateFullFileNamePreview();
    });
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
