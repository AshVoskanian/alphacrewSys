import {
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CrewMainListActionData, CrewMainListItem, MainListComponent } from "../main-list/main-list.component";
import { CrewDetail, CrewNote, CrewNoteInput } from "../../../../../shared/interface/crew";
import { ApiBase } from "../../../../../shared/bases/api-base";
import { DatePipe } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../../../shared/services/general.service";
import { finalize } from "rxjs";
import { TextEditComponent } from "../text-edit/text-edit.component";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ConfirmModalComponent } from "../../../../../shared/components/ui/confirm-modal/confirm-modal.component";
import { TextAddComponent } from "../text-add/text-add.component";

@Component({
  selector: 'app-crew-notes',
  imports: [ MainListComponent, TextEditComponent, TextAddComponent, ConfirmModalComponent ],
  templateUrl: './crew-notes.component.html',
  styleUrl: './crew-notes.component.scss',
  providers: [ DatePipe ]
})
export class CrewNotesComponent extends ApiBase implements OnInit, OnChanges {
  private _modal = inject(NgbModal);
  private readonly _dr = inject(DestroyRef);

  @ViewChild('addNote') addNoteModal: TextEditComponent;
  @ViewChild('textEdit') textEdit: TextEditComponent;
  @ViewChild('confirmModal') confirmModal: ConfirmModalComponent;

  crewDetail = input<CrewDetail>();

  editText = signal<string>('');
  loading = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  selectedListItem = signal<CrewNote>(null);
  notesList = signal<CrewMainListItem<CrewNote>[]>([]);

  private addModalRef!: NgbModalRef;
  private editModalRef!: NgbModalRef;
  private confirmModalRef!: NgbModalRef;

  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['crewDetail'] && changes['crewDetail'].currentValue) {
      this.getNotes(this.crewDetail());
    }
  }

  getNotes(crewDetail: CrewDetail) {
    this.loading.set(true);

    const { crewId } = crewDetail;

    this.get<CrewNote[]>('Crew/GetCrewNotes', { crewId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message)
            return;
          }
          this.notesList.set(
            res.data.map(it => ({
              title: it.enteredBy,
              date: it.crewNoteDate,
              desc: it.note,
              hasAction: true,
              data: it
            }))
          )
        }
      })
  }

  action(data: CrewMainListActionData) {
    if (data.action === 'remove') {
      this.openConfirmModal();
    }
    if (data.action === 'edit') {
      this.openEditNoteModal(data.listItem.desc);
    }

    this.selectedListItem.set(data.listItem.data);
  }

  openEditNoteModal(text: string) {
    this.editText.set(text);
    this.editModalRef = this._modal.open(this.textEdit, { centered: true, size: 'lg' });
  }

  openAddNoteModal() {
    this.addModalRef = this._modal.open(this.addNoteModal, { centered: true, size: 'lg' });
  }

  openConfirmModal() {
    this.confirmModalRef = this._modal.open(this.confirmModal, { centered: true, size: 'md' })
  }

  closeConfirmModal(result: 'ok' | 'cancel') {
    if (result === 'ok') {
      this.removeNote(this.selectedListItem());
      return;
    }
    this.confirmModalRef?.close();
  }

  closeEditModal(text: string) {
    if (!text) {
      this.editModalRef?.close();
      return;
    }

    if (text) {
      this.editNote(text);
    }
  }

  closeAddModal(data: { note: string, date: string }) {
    if (!data) {
      this.addModalRef?.close();
      return;
    }

    if (data) {
      this.addNote(data.note, data.date);
    }
  }

  editNote(note: string) {
    if (this.modalLoading()) return;

    this.modalLoading.set(true);

    const selected = this.selectedListItem();

    const data: CrewNoteInput = {
      crewNoteId: selected.crewNoteId,
      crewId: selected.crewId,
      crewNoteDate: selected.crewNoteDate,
      enteredBy: selected.enteredBy,
      note
    };

    this.post<CrewNote>('Crew/AddOrUpdateCrewNote', data)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.modalLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const updatedNote = res.data;

          this.notesList.update(list => {
            const exists = list.some(it => it.data.crewNoteId === updatedNote.crewNoteId);

            if (exists) {
              return list.map(item =>
                item.data.crewNoteId === updatedNote.crewNoteId
                  ? {
                    title: updatedNote.enteredBy,
                    date: updatedNote.crewNoteDate,
                    desc: updatedNote.note,
                    hasAction: true,
                    data: updatedNote
                  }
                  : item
              );
            }

            const newItem = {
              title: updatedNote.enteredBy,
              date: updatedNote.crewNoteDate,
              desc: updatedNote.note,
              hasAction: true,
              data: updatedNote
            };

            return [ newItem, ...list ];
          });

          this.editModalRef?.close();
          GeneralService.showSuccessMessage();
        },
        error: () => this.modalLoading.set(false)
      });
  }

  addNote(note: string, crewNoteDate: string) {
    if (this.modalLoading()) return;

    this.modalLoading.set(true);

    const { crewId } = this.crewDetail();

    const data: CrewNoteInput = {
      crewId,
      crewNoteDate: new Date(crewNoteDate).toISOString(),
      note
    };

    this.post<CrewNote>('Crew/AddOrUpdateCrewNote', data)
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.modalLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const newNote = res.data;

          this.notesList.update(list => [
            {
              title: newNote.note,
              desc: newNote.note,
              date: newNote.crewNoteDate,
              hasAction: true,
              data: newNote
            },
            ...list
          ]);

          this.editModalRef?.close();
          GeneralService.showSuccessMessage();
        },
        error: () => this.modalLoading.set(false)
      });
  }

  removeNote(listItem: CrewNote) {
    if (!listItem || this.modalLoading()) return;

    this.modalLoading.set(true);
    const { crewNoteId } = listItem;

    this.get('Crew/RemoveCrewNote', { crewNoteId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.modalLoading.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.notesList.update(list =>
            list.filter(item => item.data.crewNoteId !== this.selectedListItem().crewNoteId)
          );
          this.confirmModalRef?.close();
          GeneralService.showSuccessMessage('The note has been successfully deleted');
        }
      })
  }
}
