import { afterNextRender, Component, DestroyRef, inject, Injector, Input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { NgbPopover, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiBase } from '../../../../../shared/bases/api-base';
import { GeneralService } from '../../../../../shared/services/general.service';
import { Schedule } from '../../../../../shared/interface/schedule';
import { PhoneInputComponent } from '../../../../../shared/components/ui/phone-input/phone-input.component';

@Component({
  selector: 'app-schedule-job-part-onsite-contact',
  standalone: true,
  imports: [ ReactiveFormsModule, NgbPopoverModule, PhoneInputComponent ],
  templateUrl: './schedule-job-part-onsite-contact.component.html',
  styleUrl: './schedule-job-part-onsite-contact.component.scss'
})
export class ScheduleJobPartOnsiteContactComponent extends ApiBase {
  @Input({ required: true }) schedule!: Schedule;

  private readonly _dr = inject(DestroyRef);
  private readonly _injector = inject(Injector);
  private readonly _fb = inject(FormBuilder);

  savingOnsiteContact = signal(false);

  private onsiteContactPopoverInitial = { onsiteContact: '', onsiteEmail: '', onsitePhone: '' };
  private onsiteContactPopoverCommitted = false;
  private activeOnsiteContactPopover: NgbPopover | null = null;
  onsiteContactPopoverOpen = signal(false);

  readonly form = this._fb.group({
    onsiteContact: [ '', [ Validators.maxLength(200) ] ],
    onsiteEmail: [ '', [ Validators.email, Validators.maxLength(254) ] ],
    onsitePhone: [ null as string | null ]
  });

  constructor() {
    const http = inject(HttpClient);
    super(http);
  }

  get onsiteContactDisplay(): string {
    return (this.schedule.onsiteContact ?? '').trim();
  }

  get onsiteEmailDisplay(): string {
    return (this.schedule.onsiteEmail ?? '').trim();
  }

  get onsitePhoneDisplay(): string {
    return (this.schedule.onsitePhone ?? '').trim();
  }

  get hasOnsiteInfo(): boolean {
    return !!(this.onsiteContactDisplay || this.onsiteEmailDisplay || this.onsitePhoneDisplay);
  }

  get onsiteSummaryDisplay(): string {
    return [ this.onsiteContactDisplay, this.onsiteEmailDisplay, this.onsitePhoneDisplay ]
      .filter(Boolean)
      .join(' · ');
  }

  private preparePopover(): void {
    this.onsiteContactPopoverInitial = {
      onsiteContact: this.onsiteContactDisplay,
      onsiteEmail: this.onsiteEmailDisplay,
      onsitePhone: this.onsitePhoneDisplay
    };
    this.form.reset({
      onsiteContact: this.onsiteContactPopoverInitial.onsiteContact,
      onsiteEmail: this.onsiteContactPopoverInitial.onsiteEmail,
      onsitePhone: this.onsiteContactPopoverInitial.onsitePhone || null
    }, { emitEvent: false });
    this.onsiteContactPopoverOpen.set(true);
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

    if (this.form.invalid) {
      GeneralService.markFormGroupTouched(this.form);
      return;
    }

    const raw = this.form.getRawValue();
    const next = {
      onsiteContact: (raw.onsiteContact ?? '').trim(),
      onsiteEmail: (raw.onsiteEmail ?? '').trim(),
      onsitePhone: (raw.onsitePhone ?? '').trim()
    };
    const initial = this.onsiteContactPopoverInitial;

    if (
      next.onsiteContact === initial.onsiteContact &&
      next.onsiteEmail === initial.onsiteEmail &&
      next.onsitePhone === initial.onsitePhone
    ) {
      this.onsiteContactPopoverCommitted = true;
      popover.close();
      return;
    }

    this.savingOnsiteContact.set(true);
    this.form.disable({ emitEvent: false });

    this.get<unknown>('Schedule/UpdateJobPartOnsiteContact', {
      jobPartId,
      onsiteContact: next.onsiteContact,
      onsiteEmail: next.onsiteEmail,
      onsitePhone: next.onsitePhone
    })
      .pipe(
        takeUntilDestroyed(this._dr),
        finalize(() => {
          this.savingOnsiteContact.set(false);
          this.form.enable({ emitEvent: false });
        })
      )
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.schedule.onsiteContact = next.onsiteContact;
          this.schedule.onsiteEmail = next.onsiteEmail;
          this.schedule.onsitePhone = next.onsitePhone;
          this.onsiteContactPopoverCommitted = true;
          GeneralService.showSuccessMessage('Onsite contact saved');
          popover.close();
        },
        error: () => {
          GeneralService.showErrorMessage('Could not save onsite contact');
        }
      });
  }

  private revertOnsiteContactDisplay(initial: {
    onsiteContact: string;
    onsiteEmail: string;
    onsitePhone: string;
  }): void {
    this.schedule.onsiteContact = initial.onsiteContact;
    this.schedule.onsiteEmail = initial.onsiteEmail;
    this.schedule.onsitePhone = initial.onsitePhone;
  }
}
