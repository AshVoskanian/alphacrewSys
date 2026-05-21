import { afterNextRender, Component, DestroyRef, inject, Injector, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { NgbPopover, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { GeneralService } from '../../../../../shared/services/general.service';
import { Schedule } from '../../../../../shared/interface/schedule';

@Component({
  selector: 'app-schedule-job-part-onsite-contact',
  standalone: true,
  imports: [ FormsModule, NgbPopoverModule ],
  templateUrl: './schedule-job-part-onsite-contact.component.html',
  styleUrl: './schedule-job-part-onsite-contact.component.scss'
})
export class ScheduleJobPartOnsiteContactComponent extends ApiBase {
  @Input({ required: true }) schedule!: Schedule;

  private readonly _dr = inject(DestroyRef);
  private readonly _injector = inject(Injector);

  savingOnsiteContact = signal(false);

  onsiteContactEditDraft = '';
  private onsiteContactPopoverInitial = '';
  private onsiteContactPopoverCommitted = false;
  private activeOnsiteContactPopover: NgbPopover | null = null;
  onsiteContactPopoverOpen = signal(false);

  constructor() {
    const http = inject(HttpClient);
    super(http);
  }

  get onsiteContactDisplay(): string {
    return (this.schedule.onsiteContact ?? '').trim();
  }

  private preparePopover(): void {
    const synced = this.onsiteContactDisplay;
    this.onsiteContactPopoverInitial = synced;
    this.onsiteContactEditDraft = synced;
    this.onsiteContactPopoverOpen.set(true);
  }

  onOnsiteContactDraftChange(value: string): void {
    this.onsiteContactEditDraft = value;
  }

  onOnsiteContactTriggerClick(popover: NgbPopover, event: Event): void {
    event.stopPropagation();
    if (popover.isOpen()) {
      this.activeOnsiteContactPopover = null;
      popover.close();
      return;
    }
    this.onsiteContactPopoverCommitted = false;
    this.preparePopover();
    this.activeOnsiteContactPopover = popover;
    popover.open();
    afterNextRender(
      () => {
        queueMicrotask(() => {
          const el = document.querySelector<HTMLInputElement>(
            '.job-part-onsite-contact-popover input[name="onsiteContactDraft"]'
          );
          el?.focus();
          el?.select();
        });
      },
      { injector: this._injector }
    );
  }

  onOnsiteContactPopoverHidden(): void {
    if (!this.onsiteContactPopoverCommitted) {
      this.revertOnsiteContactDisplay(this.onsiteContactPopoverInitial);
    }
    this.onsiteContactPopoverCommitted = false;
    this.activeOnsiteContactPopover = null;
    this.onsiteContactPopoverOpen.set(false);
  }

  commitOnsiteContactFromPopover(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.persistOnsiteContactFromPopover();
  }

  onOnsiteContactInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.persistOnsiteContactFromPopover();
    }
  }

  private persistOnsiteContactFromPopover(): void {
    const jobPartId = this.schedule.jobPartId;
    const popover = this.activeOnsiteContactPopover;
    if (jobPartId == null || !popover) {
      return;
    }

    const initialTrim = (this.onsiteContactPopoverInitial ?? '').trim();
    const value = (this.onsiteContactEditDraft ?? '').trim();

    if (value === initialTrim) {
      this.onsiteContactPopoverCommitted = true;
      popover.close();
      return;
    }

    this.savingOnsiteContact.set(true);

    this.get<unknown>('Schedule/UpdateJobPartOnsiteContact', { jobPartId, onsiteContact: value })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => this.savingOnsiteContact.set(false))
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.schedule.onsiteContact = value;
          this.onsiteContactPopoverCommitted = true;
          GeneralService.showSuccessMessage('Onsite contact saved');
          popover.close();
        },
        error: () => {
          GeneralService.showErrorMessage('Could not save onsite contact');
        }
      });
  }

  private revertOnsiteContactDisplay(initialRaw: string): void {
    this.schedule.onsiteContact = initialRaw;
  }
}
