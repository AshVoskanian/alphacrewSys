import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { GeneralService } from '../../../../../../shared/services/general.service';
import { CrewHoliday } from '../../../../../../shared/interface/crew';
import { debounceTime, distinctUntilChanged, filter, map, merge, Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-holiday-add-update',
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
  ],
  templateUrl: './holiday-add-update.component.html',
  styleUrl: './holiday-add-update.component.scss'
})
export class HolidayAddUpdateComponent implements OnInit {
  @ViewChild('instance') instance: NgbTypeahead;

  @Output() closeModal: EventEmitter<{
    startDate: string,
    endDate: string,
    comment: string
  } | null> = new EventEmitter<{
    startDate: string,
    endDate: string,
    comment: string
  } | null>();

  @Input() loading: boolean = false;
  @Input() selectedHoliday: CrewHoliday;

  readonly holidayCommentSuggestions: readonly string[] = [
    'Holiday',
    'Sickness',
    'Bereavement / Compassionate',
    'Travel disruption',
    'Maternity, Paternity and Adoption Leave',
    'Witness at court / Jury duty',
    'Appointments',
    'Training / Disciplinary',
    'Sabbaticals',
    'AWOL / Lateness',
    'Unpaid leave / Exceptional circumstances',
  ];

  public focus$ = new Subject<string>();
  public click$ = new Subject<string>();

  public form: FormGroup;

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    const endDate = this.selectedHoliday?.holidayEnd?.split('T')[0] ?? '';
    const startDate = this.selectedHoliday?.holidayStart?.split('T')[0] ?? '';
    const existingComment = this.selectedHoliday?.comments
      ? GeneralService.stripHtmlTags(this.selectedHoliday.comments)
      : '';

    this.form = new FormGroup({
      endDate: new FormControl(endDate, Validators.required),
      startDate: new FormControl(startDate, Validators.required),
      comment: new FormControl(existingComment, Validators.required),
    });
  }

  inputFormatter = (value: string) => (typeof value === 'string' ? value : '');

  resultFormatter = (item: string) => item;

  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance?.isPopupOpen?.()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term => {
        if (!term) {
          return [...this.holidayCommentSuggestions];
        }

        return this.holidayCommentSuggestions.filter(s =>
          s.toLowerCase().includes(term.toLowerCase())
        );
      })
    );
  };

  save() {
    const raw = this.form.get('comment')?.value;
    const comment = typeof raw === 'string' ? raw.trim() : '';

    this.closeModal.emit({
      startDate: this.form.get('startDate').value,
      endDate: this.form.get('endDate').value,
      comment: GeneralService.stripHtmlTags(comment),
    });
  }
}
