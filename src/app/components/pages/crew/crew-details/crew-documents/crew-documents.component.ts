import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  WritableSignal
} from '@angular/core';
import { TableComponent } from "../../../../../shared/components/ui/table/table.component";
import { TableClickedAction, TableConfigs } from "../../../../../shared/interface/common";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../../../shared/services/general.service";
import { CrewDetail } from "../../../../../shared/interface/crew";
import { finalize } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { CrewService } from "../../crew.service";

@Component({
  selector: 'app-crew-documents',
  imports: [
    TableComponent
  ],
  templateUrl: './crew-documents.component.html',
  styleUrl: './crew-documents.component.scss'
})
export class CrewDocumentsComponent extends ApiBase implements OnInit, OnChanges {
  private readonly _dr = inject(DestroyRef);
  private readonly _http = inject(HttpClient);
  private readonly _crewService = inject(CrewService);
  private readonly _cdr = inject(ChangeDetectorRef);

  crewDetail = input<CrewDetail>();

  loading = signal<boolean>(false);

  public tableConfig: WritableSignal<TableConfigs> = signal({
    columns: [
      { title: 'File Name', field_value: 'fileName', sort: true },
    ],
    row_action: [
      { label: "Delete", action_to_perform: "delete", icon: "trash1", modal: true }
    ],
    data: [] as any[]
  });

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getDocuments(this.crewDetail());
    }
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
      })
  }

  handleAction(value: TableClickedAction) {
    if (value.action_to_perform === "delete" && value.data) {
      this.deleteDocument(value?.data?.fileName);
    }
  }

  deleteDocument(fileName: string) {
    this.loading.set(true);

    this.post(`Crew/DeleteCrewDocumentAsync?fileName=${ fileName }`, null)
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

  uploadFile(e: any) {
    const file = e.target.files[0];
    const reader = new FileReader();

    this.loading.set(true);

    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const fileName = file.name;

      const payload = {
        crewId: this.crewDetail()?.crewId,
        fileName: fileName,
        fileBase64: base64
      };

      this._crewService.post('Crew/UploadCrewDocumentAsync', payload)
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
    };

    reader.readAsDataURL(file);
  }
}
