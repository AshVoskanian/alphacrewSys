import { Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Select2Module, Select2Option, Select2UpdateEvent, Select2UpdateValue } from 'ng-select2-component';
import { finalize } from 'rxjs';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { TableComponent } from '../../../../../shared/components/ui/table/table.component';
import { TableConfigs } from '../../../../../shared/interface/common';
import { CrewFeedback } from '../../../../../shared/interface/crew';
import { Crew } from '../../../../../shared/interface/schedule';
import { GeneralService } from '../../../../../shared/services/general.service';

interface CrewFeedbackRow extends CrewFeedback {
  id: number;
  onTime: string;
}

@Component({
  selector: 'app-dashboard-crew-feedback',
  imports: [ CardComponent, TableComponent, Select2Module ],
  templateUrl: './dashboard-crew-feedback.component.html',
  styleUrl: './dashboard-crew-feedback.component.scss'
})
export class DashboardCrewFeedbackComponent extends ApiBase implements OnInit {
  private readonly _dr = inject(DestroyRef);

  crewListLoading = signal(false);
  feedbackLoading = signal(false);
  selectedCrewId = signal<number | null>(null);
  crewOptions = signal<Select2Option[]>([]);

  tableConfig: WritableSignal<TableConfigs> = signal({
    columns: [
      { title: 'Date', field_value: 'modifiedDate', sort: true, type: 'date', min_width: 120 },
      { title: 'By', field_value: 'modifiedBy', sort: true, min_width: 110 },
      { title: 'On Time', field_value: 'onTime', sort: true, min_width: 80 },
      { title: 'Presentation', field_value: 'presentation', sort: true, min_width: 100 },
      { title: 'Teamwork', field_value: 'teamwork', sort: true, min_width: 90 },
      { title: 'Professionalism', field_value: 'professionalism', sort: true, min_width: 120 },
      { title: 'Attitude', field_value: 'attitude', sort: true, min_width: 90 },
      { title: 'Rating', field_value: 'rating', sort: true, min_width: 70 },
      { title: 'Notes', field_value: 'ratingtext', sort: true, min_width: 180 },
    ],
    data: [] as CrewFeedbackRow[]
  });

  ngOnInit(): void {
    this.loadCrewList();
  }

  onCrewChange(event: Select2UpdateEvent<Select2UpdateValue>): void {
    const nextCrewId = event.value == null || event.value === '' ? null : Number(event.value);
    if (nextCrewId === this.selectedCrewId()) {
      return;
    }

    this.selectedCrewId.set(Number.isFinite(nextCrewId) ? nextCrewId : null);

    if (!this.selectedCrewId()) {
      this.tableConfig.update((config) => ({ ...config, data: [] }));
      return;
    }

    this.loadFeedback(this.selectedCrewId()!);
  }

  private loadCrewList(): void {
    this.crewListLoading.set(true);

    this.get<Crew[]>('Crew/GetCrewList', {})
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.crewListLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          const options = (res.data ?? [])
            .map((crew) => ({
              value: crew.crewId,
              label: crew.name?.trim() || `Crew #${ crew.crewId }`
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.crewOptions.set(options);
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to load crew list');
        }
      });
  }

  private loadFeedback(crewId: number): void {
    this.feedbackLoading.set(true);

    this.get<CrewFeedback[]>('Crew/GetCrewFeedBack', { crewId })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.feedbackLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.tableConfig.update((config) => ({
            ...config,
            data: (res.data ?? []).map((item) => ({
              ...item,
              id: item.ratingId,
              onTime: item.early === 1 ? 'Yes' : 'No',
              ratingtext: item.ratingtext?.trim() || '—'
            }))
          }));
        },
        error: () => {
          GeneralService.showErrorMessage('Failed to load crew feedback');
        }
      });
  }
}
