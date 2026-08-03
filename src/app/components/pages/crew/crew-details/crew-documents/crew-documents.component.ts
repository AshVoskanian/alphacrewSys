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
  CrewDocumentUploadPayload
} from '../../../../../shared/interface/crew';
import { finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CrewService } from '../../crew.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DocumentUploadComponent } from './document-upload/document-upload.component';

@Component({
  selector: 'app-crew-documents',
  imports: [
    TableComponent,
    DocumentUploadComponent,
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

  crewDetail = input<CrewDetail>();

  loading = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  commentDraft = signal<string>('');
  commentSaving = signal<boolean>(false);
  openingDocument = signal<string | null>(null);

  private uploadModalRef!: NgbModalRef;

  public tableConfig: WritableSignal<TableConfigs> = signal({
    columns: [
      { title: 'DL', field_value: 'dl', sort: false, type: 'template' },
      { title: 'File Name', field_value: 'displayFileName', sort: true },
      { title: 'Document Type', field_value: 'documentType', sort: true },
      { title: 'ExpiryDate', field_value: 'expiryDate', sort: true },
      { title: 'Version', field_value: 'version', sort: true },
    ],
    row_action: [
      { label: 'Delete', action_to_perform: 'delete', icon: 'trash1', modal: true }
    ],
    data: [] as CrewDocumentRow[]
  });

  constructor(http: HttpClient) {
    super(http);
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
    return /\.(xlsx|xls|xlsm|xlsb)$/i.test(fileName);
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
    this.uploadModalRef = this._modal.open(this.uploadDocument, { centered: true, size: 'lg' });
  }

  closeUploadModal(data: CrewDocumentUploadPayload | null): void {
    if (!data) {
      this.uploadModalRef?.close();
      return;
    }

    this.uploadDocumentFile(data);
  }

  private uploadDocumentFile(data: CrewDocumentUploadPayload): void {
    if (this.modalLoading()) {
      return;
    }

    const crewId = this.crewDetail()?.crewId;
    if (crewId == null || crewId <= 0) {
      GeneralService.showErrorMessage('No crew selected.');
      return;
    }

    this.modalLoading.set(true);

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];

      const payload = {
        crewId,
        fileName: data.fileName,
        fileBase64: base64,
        documentType: data.documentType,
        expireDate: data.expireDate,
      };

      this._crewService.post('Crew/UploadCrewDocumentAsync', payload)
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

            this.uploadModalRef?.close();
            this.getDocuments(this.crewDetail());
            this._cdr.detectChanges();
          },
          error: () => {
            GeneralService.showErrorMessage('Failed to upload document');
          }
        });
    };

    reader.onerror = () => {
      this.modalLoading.set(false);
      GeneralService.showErrorMessage('Failed to read file');
    };

    reader.readAsDataURL(data.file);
  }

  private mapDocumentRow(fileName: string, id: number): CrewDocumentRow {
    const parsed = this.parseDocumentFileName(fileName);

    return {
      id,
      fileName,
      displayFileName: parsed.displayFileName,
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

    const dateMatch = nameWithoutExtension.match(/_(\d{8})_/);
    if (!dateMatch || dateMatch.index == null) {
      return {
        displayFileName: fileName,
        documentType: '',
        expiryDate: '',
        version: '',
      };
    }

    const rawDate = dateMatch[1];
    const beforeDate = nameWithoutExtension.slice(0, dateMatch.index);
    const afterDate = nameWithoutExtension.slice(dateMatch.index + dateMatch[0].length);

    const firstUnderscoreIndex = beforeDate.indexOf('_');
    const documentType = firstUnderscoreIndex >= 0
      ? beforeDate.slice(firstUnderscoreIndex + 1)
      : '';

    const versionMatch = afterDate.match(/^(.*)_(\d+)$/);
    const baseName = versionMatch ? versionMatch[1] : afterDate;
    const version = versionMatch ? versionMatch[2] : '';

    return {
      displayFileName: `${baseName}${extension}`,
      documentType,
      expiryDate: this.formatExpiryDate(rawDate),
      version,
    };
  }

  private formatExpiryDate(rawDate: string): string {
    if (!/^\d{8}$/.test(rawDate)) {
      return rawDate;
    }

    return `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  }
}
