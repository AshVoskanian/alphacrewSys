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
import { Select2Data, Select2Module } from 'ng-select2-component';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, startWith } from 'rxjs';
import { ApiBase } from '../../../../../../shared/bases/api-base';
import { GeneralService } from '../../../../../../shared/services/general.service';
import { CrewDocumentType, CrewDocumentUploadPayload } from '../../../../../../shared/interface/crew';

@Component({
  selector: 'app-document-upload',
  imports: [
    ReactiveFormsModule,
    Select2Module,
  ],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss'
})
export class DocumentUploadComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);

  @Output() closeModal: EventEmitter<CrewDocumentUploadPayload | null> = new EventEmitter();

  @Input() loading = false;
  @Input() crewId: number | null = null;

  form: FormGroup;
  documentTypes = signal<Select2Data>([]);
  documentTypesLoading = signal(false);
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
      documentType: new FormControl(null, Validators.required),
      expireDate: new FormControl('', Validators.required),
      fileName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      file: new FormControl<File | null>(null, Validators.required),
    });
  }

  loadDocumentTypes(): void {
    this.documentTypesLoading.set(true);

    this.get<CrewDocumentType[]>('Crew/GetDocumentTypes')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.documentTypesLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.documentTypes.set(
            (res.data ?? []).map((item) => ({
              value: item.documentName,
              label: item.documentName,
            }))
          );
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
    this.selectedFileName.set(file?.name ?? '');
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
      file: File;
    };

    this.closeModal.emit({
      documentType,
      expireDate: new Date(`${expireDate}T00:00:00.000Z`).toISOString(),
      fileName: this.buildFullFileName(String(fileName).trim(), documentType, expireDate, file.name),
      file,
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

    this.fullFileNamePreview.set(
      this.buildFullFileName(typedName, documentType, expireDate, file?.name ?? '')
    );
  }

  private buildFullFileName(
    name: string,
    documentType: string | null | undefined,
    expireDate: string | null | undefined,
    uploadedFileName: string
  ): string {
    const extension = this.getFileExtension(uploadedFileName);
    const baseName = this.stripFileExtension(name);
    const crewIdPart = this.crewId != null ? String(this.crewId) : '';
    const typePart = documentType?.trim() || '';
    const datePart = this.formatExpireDate(expireDate);

    return `${crewIdPart}_${typePart}_${datePart}_${baseName}${extension}`;
  }

  private formatExpireDate(expireDate: string | null | undefined): string {
    if (!expireDate) {
      return '';
    }

    return expireDate.replace(/-/g, '');
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
      return '';
    }

    return fileName.slice(lastDotIndex);
  }

  private stripFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex <= 0) {
      return fileName;
    }

    return fileName.slice(0, lastDotIndex);
  }
}
