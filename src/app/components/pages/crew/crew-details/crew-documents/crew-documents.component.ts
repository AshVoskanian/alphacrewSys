import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  TemplateRef,
  ViewChild,
  WritableSignal
} from '@angular/core';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { TableClickedAction, TableConfigs } from '../../../../../shared/interface/common';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeneralService } from '../../../../../shared/services/general.service';
import {
  CrewDetail,
  CrewDocumentRow,
  CrewDocumentType,
  CrewDocumentUploadPayload
} from '../../../../../shared/interface/crew';
import { finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CrewService } from '../../crew.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Select2Option } from 'ng-select2-component';
import { DocumentUploadComponent } from './document-upload/document-upload.component';
import { DocumentEditComponent } from './document-edit/document-edit.component';

@Component({
  selector: 'app-crew-documents',
  imports: [
    TableComponent,
    DocumentUploadComponent,
    DocumentEditComponent,
  ],
  templateUrl: './crew-documents.component.html',
  styleUrl: './crew-documents.component.scss'
})
export class CrewDocumentsComponent extends ApiBase {
  private readonly _dr = inject(DestroyRef);
  private readonly _crewService = inject(CrewService);
  private readonly _generalService = inject(GeneralService);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly _modal = inject(NgbModal);

  @ViewChild('uploadDocument') uploadDocument: TemplateRef<unknown>;
  @ViewChild('editDocument') editDocument: TemplateRef<unknown>;

  crewDetail = input<CrewDetail>();

  loading = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  commentDraft = signal<string>('');
  commentSaving = signal<boolean>(false);
  openingDocument = signal<string | null>(null);
  selectedDocument = signal<CrewDocumentRow | null>(null);
  documentTypes = signal<Select2Option[]>([]);

  private documentModalRef!: NgbModalRef;
  private documentTypesLoaded = false;
  private documentTypesLoading = false;

  public tableConfig: WritableSignal<TableConfigs> = signal({
    columns: [
      { title: 'DL', field_value: 'dl', sort: false, type: 'template' },
      { title: 'File Name', field_value: 'displayFileName', sort: true },
      { title: 'Document Type', field_value: 'documentType', sort: true },
      { title: 'ExpiryDate', field_value: 'expiryDate', sort: true },
      { title: 'Version', field_value: 'version', sort: true },
    ],
    row_action: [
      {
        label: 'Edit',
        action_to_perform: 'edit',
        icon: 'fa-solid fa-pen-to-square txt-primary',
        class: 'square-white'
      },
      {
        label: 'Delete',
        action_to_perform: 'delete',
        icon: 'trash1',
        modal: true
      }
    ],
    data: [] as CrewDocumentRow[]
  });

  constructor(http: HttpClient) {
    super(http);
    this.loadDocumentTypes();
    effect(() => {
      const detail = this.crewDetail();
      if (!detail) {
        this.commentDraft.set('');
        return;
      }
      this.commentDraft.set(detail.documents ?? '');
      if (detail.crewId != null && detail.crewId > 0) {
        this.getDocuments(detail);
      }
    });
  }

  private loadDocumentTypes(): void {
    if (this.documentTypesLoaded || this.documentTypesLoading) {
      return;
    }

    this.documentTypesLoading = true;

    this.get<CrewDocumentType[]>('Crew/GetDocumentTypes')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.documentTypesLoading = false)
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
          this.documentTypesLoaded = true;
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to load document types');
        },
      });
  }

  saveComment(): void {
    const detail = this.crewDetail();
    const crewId = detail?.crewId;
    if (crewId == null || crewId <= 0) {
      GeneralService.showErrorMessage('No crew selected.');
      return;
    }

    if (this.commentSaving()) {
      return;
    }

    const documentNote = this.commentDraft().trim();
    if (!documentNote) {
      GeneralService.showErrorMessage('Comment is required.');
      return;
    }

    this.commentSaving.set(true);

    this.post<unknown>('Crew/AddCrewDocumentsNote', { crewId, documentNote })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.commentSaving.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }
          GeneralService.showSuccessMessage('Comment saved');
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to save comment');
        },
      });
  }

  getDocuments(crewDetail: CrewDetail) {
    this.loading.set(true);
    const { crewId } = crewDetail;

    this.get<{ fileName: string }[]>('Crew/GetCrewDocumentAsync', { crewId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors && res.errors.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig().data = [];
          this._cdr.detectChanges();

          this.tableConfig().data = (res.data ?? []).map((item, index) =>
            this.mapDocumentRow(item.fileName, index + 1)
          );

          this._cdr.detectChanges();
        }
      });
  }

  handleAction(value: TableClickedAction) {
    if (value.action_to_perform === 'edit' && value.data) {
      this.openEditModal(value.data as CrewDocumentRow);
      return;
    }

    if (value.action_to_perform === 'delete' && value.data) {
      this.deleteDocument(value?.data?.fileName);
    }
  }

  openDocument(fileName: string) {
    if (this.openingDocument()) {
      return;
    }

    this.openingDocument.set(fileName);

    this.getFile(`Crew/download/${ encodeURIComponent(fileName) }`, 'blob')
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.openingDocument.set(null))
      )
      .subscribe({
        next: (blob) => {
          const typedBlob = this.withMimeType(blob, fileName);

          if (this.shouldDownloadFile(fileName)) {
            this._generalService.downloadBlob(typedBlob, fileName);
            return;
          }

          this._generalService.openBlobInNewTab(typedBlob);
        },
        error: () => GeneralService.showErrorMessage('Failed to open document')
      });
  }

  private shouldDownloadFile(fileName: string): boolean {
    return /\.(xlsx|xls|xlsm|xlsb|doc|docx)$/i.test(fileName);
  }

  private withMimeType(blob: Blob, fileName: string): Blob {
    const mimeType = this.getMimeType(fileName);
    if (!mimeType) {
      return blob;
    }

    if (blob.type && blob.type !== 'application/octet-stream') {
      return blob;
    }

    return new Blob([blob], { type: mimeType });
  }

  private getMimeType(fileName: string): string | null {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'bmp':
        return 'image/bmp';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'xlsm':
        return 'application/vnd.ms-excel.sheet.macroEnabled.12';
      case 'xlsb':
        return 'application/vnd.ms-excel.sheet.binary.macroEnabled.12';
      default:
        return null;
    }
  }

  deleteDocument(fileName: string) {
    this.loading.set(true);

    this.get(`Crew/DeleteCrewDocumentAsync?fileName=${ fileName }`, null)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors && res.errors.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.getDocuments(this.crewDetail());
          this._cdr.detectChanges();
        }
      });
  }

  openUploadModal(): void {
    this.selectedDocument.set(null);
    this.documentModalRef = this._modal.open(this.uploadDocument, { centered: true, size: 'lg' });
  }

  openEditModal(document: CrewDocumentRow): void {
    this.selectedDocument.set(document);
    this._cdr.detectChanges();
    this.documentModalRef = this._modal.open(this.editDocument, { centered: true, size: 'lg' });
  }

  closeDocumentModal(data: CrewDocumentUploadPayload | null): void {
    if (!data) {
      this.documentModalRef?.close();
      this.selectedDocument.set(null);
      return;
    }

    this.saveDocument(data);
  }

  private saveDocument(data: CrewDocumentUploadPayload): void {
    if (this.modalLoading()) {
      return;
    }

    const crewId = this.crewDetail()?.crewId;
    if (crewId == null || crewId <= 0) {
      GeneralService.showErrorMessage('No crew selected.');
      return;
    }

    this.modalLoading.set(true);

    if (data.file) {
      this.readFileAsBase64(data.file)
        .then((fileBase64) => this.submitDocument(crewId, data, fileBase64))
        .catch(() => {
          this.modalLoading.set(false);
          GeneralService.showErrorMessage('Failed to read file');
        });
      return;
    }

    if (!data.oldFileName) {
      this.modalLoading.set(false);
      GeneralService.showErrorMessage('File is required.');
      return;
    }

    this.getFile(`Crew/download/${ encodeURIComponent(data.oldFileName) }`, 'blob')
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (blob) => {
          this.readFileAsBase64(blob)
            .then((fileBase64) => this.submitDocument(crewId, data, fileBase64))
            .catch(() => {
              this.modalLoading.set(false);
              GeneralService.showErrorMessage('Failed to read file');
            });
        },
        error: () => {
          this.modalLoading.set(false);
          GeneralService.showErrorMessage('Failed to load existing document');
        }
      });
  }

  private submitDocument(
    crewId: number,
    data: CrewDocumentUploadPayload,
    fileBase64: string
  ): void {
    const isEdit = !!data.oldFileName;
    const endpoint = isEdit
      ? 'Crew/UpdateCrewDocumentAsync'
      : 'Crew/UploadCrewDocumentAsync';

    const payload = {
      crewId,
      fileName: data.fileName,
      fileBase64,
      documentType: data.documentType,
      expireDate: data.expireDate,
      ...(isEdit ? { jobId: 0, oldFileName: data.oldFileName } : {}),
    };

    this._crewService.post(endpoint, payload)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.modalLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors && res.errors.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.documentModalRef?.close();
          this.selectedDocument.set(null);
          this.getDocuments(this.crewDetail());
          this._cdr.detectChanges();
        },
        error: () => {
          GeneralService.showErrorMessage(
            isEdit ? 'Failed to update document' : 'Failed to upload document'
          );
        }
      });
  }

  private readFileAsBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private mapDocumentRow(fileName: string, id: number): CrewDocumentRow {
    const parsed = this.parseDocumentFileName(fileName);

    return {
      id,
      fileName,
      displayFileName: parsed.displayFileName,
      name: parsed.name,
      documentType: parsed.documentType,
      expiryDate: parsed.expiryDate,
      version: parsed.version,
    };
  }

  private parseDocumentFileName(fileName: string): Omit<CrewDocumentRow, 'id' | 'fileName'> {
    const extensionMatch = fileName.match(/(\.[^.]+)$/);
    const extension = extensionMatch?.[1] ?? '';
    const nameWithoutExtension = extension
      ? fileName.slice(0, -extension.length)
      : fileName;

    const dateMatches = [ ...nameWithoutExtension.matchAll(/_(\d{8})_/g) ];
    if (!dateMatches.length) {
      return {
        displayFileName: fileName,
        name: this.stripExtension(fileName),
        documentType: '',
        expiryDate: '',
        version: '',
      };
    }

    const firstDateMatch = dateMatches[0];
    const lastDateMatch = dateMatches[dateMatches.length - 1];
    const firstIndex = firstDateMatch.index ?? 0;
    const lastIndex = lastDateMatch.index ?? 0;

    const beforeFirstDate = nameWithoutExtension.slice(0, firstIndex);
    const afterLastDate = nameWithoutExtension.slice(lastIndex + lastDateMatch[0].length);
    const rawDate = firstDateMatch[1];

    const firstUnderscoreIndex = beforeFirstDate.indexOf('_');
    const documentType = firstUnderscoreIndex >= 0
      ? beforeFirstDate.slice(firstUnderscoreIndex + 1)
      : '';

    const versionMatch = afterLastDate.match(/^(.*)_(\d+)$/);
    const baseName = versionMatch ? versionMatch[1] : afterLastDate;
    const version = versionMatch ? versionMatch[2] : '';

    return {
      displayFileName: `${baseName}${extension}`,
      name: baseName,
      documentType,
      expiryDate: this.formatExpiryDate(rawDate),
      version,
    };
  }

  private stripExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex <= 0) {
      return fileName;
    }

    return fileName.slice(0, lastDotIndex);
  }

  private formatExpiryDate(rawDate: string): string {
    if (!/^\d{8}$/.test(rawDate)) {
      return rawDate;
    }

    return `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  }
}
