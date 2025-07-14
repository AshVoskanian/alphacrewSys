import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Schedule } from "../../../../../shared/interface/schedule";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../../../shared/services/general.service";
import { ApiBase } from "../../../../../shared/bases/api-base";

@Component({
  selector: 'app-updates-notes',
  imports: [ FormsModule ],
  templateUrl: './updates-notes.component.html',
  styleUrl: './updates-notes.component.scss'
})
export class UpdatesNotesComponent extends ApiBase implements OnInit {
  @Input() selectedSchedule: Schedule;
  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() finish: EventEmitter<Schedule> = new EventEmitter<Schedule>();

  private _dr = inject(DestroyRef);

  note: string = '';
  loading: boolean = false;
  important: boolean = false;

  ngOnInit() {
    this.setNote();
  }

  setNote() {
    const type = this.selectedSchedule.noteType;

    this.important = this.selectedSchedule.importantNotes;
    this.note = type === 'crew_note' ? this.selectedSchedule.crewNotes : this.selectedSchedule.notes;
  }

  saveNote(schedule: Schedule) {
    this.updateNote(schedule);
  }

  updateNote(schedule: Schedule) {
    if (this.loading) return;

    this.loading = true;

    const data = {
      jobPartId: schedule.jobPartId,
      notes: this.note,
      importantNotes: this.important
    }

    const updateApi = schedule.noteType === 'crew_note'
      ? this.post('Schedule/updatejobpartcrewnotes', data)
      : this.post('Schedule/updatejobpartnotes', data)

    updateApi
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.loading = false;

          if (res.errors?.errorCode) {

          } else {
            if (this.selectedSchedule.noteType === 'job_note') {
              this.selectedSchedule.notes = this.note;
            }

            if (this.selectedSchedule.noteType === 'crew_note') {
              this.selectedSchedule.crewNotes = this.note;
            }

            this.finish.emit(this.selectedSchedule);
            GeneralService.showSuccessMessage();
          }
        }
      })
  }
}
