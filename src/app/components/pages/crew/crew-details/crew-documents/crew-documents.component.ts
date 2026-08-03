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
import { CrewDetail, CrewDocumentUploadPayload } from '../../../../../shared/interface/crew';
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
  downloadingDocument = signal<string | null>(null);

  private uploadModalRef!: NgbModalRef;

  public tableConfig: WritableSignal<TableConfigs> = signal({
    columns: [
      { title: 'File Name', field_value: 'fileName', sort: true, type: 'template' },
    ],
    row_action: [
      { label: 'Delete', action_to_perform: 'delete', icon: 'trash1', modal: true }
    ],
    data: [] as any[]
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

          this.tableConfig().data = res.data.map((item: { fileName: string }, index) => ({
            ...item,
            id: index + 1
          }));

          this._cdr.detectChanges();
        }
      });
  }

  handleAction(value: TableClickedAction) {
    if (value.action_to_perform === 'delete' && value.data) {
      this.deleteDocument(value?.data?.fileName);
    }
  }

  downloadDocument(fileName: string) {
    if (this.downloadingDocument()) {
      return;
    }

    this.downloadingDocument.set(fileName);

    this._generalService.downloadFile(`Crew/download/${ encodeURIComponent(fileName) }`, fileName)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.downloadingDocument.set(null))
      )
      .subscribe({
        error: () => GeneralService.showErrorMessage('Download failed')
      });
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
}
