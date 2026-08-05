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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { CrewDocumentUploadPayload } from '../../../../../../shared/interface/crew';
import {
  buildFullFileNamePreview,
  buildSimpleFileName,
  toIsoExpireDate
} from '../document-file-name.util';

@Component({
  selector: 'app-document-upload',
  imports: [
    ReactiveFormsModule,
    Select2Module,
  ],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss'
})
export class DocumentUploadComponent implements OnInit {
  private readonly _dr = inject(DestroyRef);

  @Output() closeModal: EventEmitter<CrewDocumentUploadPayload | null> = new EventEmitter();

  @Input() loading = false;
  @Input() crewId: number | null = null;
  @Input() documentTypes: Select2Option[] = [];

  form: FormGroup;
  selectedFileName = signal('');
  fullFileNamePreview = signal('');

  ngOnInit(): void {
    this.initForm();
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
      expireDate: toIsoExpireDate(expireDate),
      fileName: buildSimpleFileName(String(fileName), file.name),
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
      buildFullFileNamePreview(typedName, documentType, expireDate, file?.name ?? '', this.crewId)
    );
  }
}
