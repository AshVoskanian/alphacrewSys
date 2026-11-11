import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { ApiBase } from "../../../../shared/bases/api-base";
import { GeneralService } from "../../../../shared/services/general.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize, forkJoin } from "rxjs";
import { AccountType, ClientDetails, RateCard } from "../../../../shared/interface/clients";
import { NgbNav, NgbNavContent, NgbNavItem, NgbNavLink, NgbNavOutlet } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-clients-form',
  imports: [
    ReactiveFormsModule,
    Select2Module,
    NgbNavOutlet,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavContent
  ],
  templateUrl: './clients-form.component.html',
  styleUrl: './clients-form.component.scss'
})
export class ClientsFormComponent extends ApiBase implements OnInit, OnChanges, AfterViewInit {
  private _dr: DestroyRef = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);

  clientDetails = input<ClientDetails>(null);

  finish = output<ClientDetails>();

  loading = signal<boolean>(false);
  rateCards = signal<Select2Option[]>([]);
  accountTypes = signal<Select2Option[]>([]);

  activeTab: string = 'profile';
  form: FormGroup;

  @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.initForm();
    this.getDropdownInfo();
  }


  async ngAfterViewInit(): Promise<void> {
    const autocomplete = new google.maps.places.Autocomplete(
      this.addressInput.nativeElement,
      {
        types: [ 'address' ],
        // componentRestrictions: { country: 'gb' }
      }
    );

    autocomplete.addListener('place_changed', () => {
      autocomplete.getPlace();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['clientDetails'] && changes['clientDetails'].currentValue) {
      this.getDropdownInfo(true);
    }
  }

  get profile() {
    return this.form.get('profile') as FormGroup;
  }

  get accountancy() {
    return this.form.get('accountancy') as FormGroup;
  }

  get notes() {
    return this.form.get('notes') as FormGroup;
  }

  initForm() {
    this.form = this._fb.group({
      profile: this._fb.group({
        companyName: [ null, [ Validators.required ] ],
        contactName: [ null, [ Validators.required ] ],
        phoneNumber: [ null, [ Validators.required ] ],
        emailAddress: [ null, [ Validators.required, this.emailOrDotValidator ] ],
        rateCardId: [ 14, [ Validators.required ] ],
        accountTypeId: [ 1, [ Validators.required ] ],
        creditLimit: [ null, [ Validators.required ] ],
        paymentDueDays: [ null, [ Validators.required ] ],
        requiresPO: [ null ],
        address: [ null ],
        postcode: [ null ],
        accountOpenDate: [ null ],
        isActive: [ null ],
      }),
      accountancy: this._fb.group({
        full_LegalName: [ null ],
        companyRegistrationNumber: [ null ],
        vatRegistrationNumber: [ null ],
        contactAccountsFirstName: [ null ],
        contactAccountsFullName: [ null ],
        contactAccountsTel: [ null ],
        contactAccountsEmailAddress: [ null, [ Validators.email ] ],
        contactAccountsCCEmailAddress: [ null, [ Validators.email ] ],
        creditRating: [ null ],
        recommendedCreditLimit: [ null ],
        paymentPerformance: [ null ],
      }),
      notes: this._fb.group({
        notes: [ null ],
        crewNotes: [ null ],
        officeNotes: [ null ],
      })
    })
  }

  setFormData(clientDetails: ClientDetails) {
    if (!clientDetails) return;

    this.form.patchValue({
      profile: {
        companyName: clientDetails.companyName,
        contactName: clientDetails.contactName,
        phoneNumber: clientDetails.phoneNumber,
        emailAddress: clientDetails.emailAddress,
        rateCardId: clientDetails.rateCardId || 14,
        accountTypeId: clientDetails.accountTypeId || 1,
        creditLimit: clientDetails.creditLimit,
        paymentDueDays: clientDetails.paymentDueDays,
        requiresPO: clientDetails.requiresPO,
        address: clientDetails.address,
        postcode: clientDetails.postcode,
        accountOpenDate: this.toDateInputValue(clientDetails.accountOpenDate),
        isActive: clientDetails.isActive,
      },
      accountancy: {
        full_LegalName: clientDetails.full_LegalName,
        companyRegistrationNumber: clientDetails.companyRegistrationNumber,
        vatRegistrationNumber: clientDetails.vatRegistrationNumber,
        contactAccountsFirstName: clientDetails.contactAccountsFirstName,
        contactAccountsFullName: clientDetails.contactAccountsFullName,
        contactAccountsTel: clientDetails.contactAccountsTel,
        contactAccountsEmailAddress: clientDetails.contactAccountsEmailAddress,
        contactAccountsCCEmailAddress: clientDetails.contactAccountsCCEmailAddress,
        creditRating: clientDetails.creditRating,
        recommendedCreditLimit: clientDetails.recommendedCreditLimit,
        paymentPerformance: clientDetails.paymentPerformance,
      },
      notes: {
        notes: clientDetails.notes,
        crewNotes: clientDetails.crewNotes,
        officeNotes: clientDetails.officeNotes,
      }
    });

    this.form.updateValueAndValidity();
  }

  getDropdownInfo(fillForm = false) {
    const rateCards$ = this.get<RateCard[]>("Clients/GetRateCardDescription");
    const accountTypes$ = this.get<AccountType[]>("Clients/GetAccountTypes");

    forkJoin([
      rateCards$,
      accountTypes$
    ]).pipe(
      takeUntilDestroyed(this._dr),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res) => {
        if (res[0]?.errors?.errorCode || res[1]?.errors.errorCode) {
          GeneralService.showErrorMessage(
            res[0]?.errors?.message || res[1]?.errors?.message
          )
          return;
        }
        this.rateCards.set(res[0].data.map(it => ({ label: it.description, value: it.rateCardId })));
        this.accountTypes.set(res[1].data.map(it => ({ label: it.accountTypeText, value: it.accountTypeId })));

        if (fillForm) {
          setTimeout(() => this.setFormData(this.clientDetails()), 100);
        } else {
          setTimeout(() => {
            this.profile.get('rateCardId').patchValue(14);
            this.profile.get('accountTypeId').patchValue(1);
          }, 100);
        }
      }
    })
  }

  private readonly emailOrDotValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value || value === '.') {
      return null;
    }

    return Validators.email(control);
  };

  private toDateInputValue(value: string | number | null | undefined): string | null {
    if (value == null || value === '') {
      return null;
    }

    if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
      let timestamp = Number(value);
      if (!Number.isFinite(timestamp)) {
        return null;
      }
      // Seconds → milliseconds
      if (timestamp > 0 && timestamp < 1e12) {
        timestamp *= 1000;
      }
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? null : this.formatDateInput(date);
    }

    const raw = String(value).trim();
    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (slashMatch) {
      const day = Number(slashMatch[1]);
      const month = Number(slashMatch[2]);
      let year = Number(slashMatch[3]);
      if (slashMatch[3].length === 2) {
        year += year >= 70 ? 1900 : 2000;
      }

      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null;
      }

      return this.formatDateInput(date);
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : this.formatDateInput(parsed);
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  submit() {
    if (this.loading()) return;
    GeneralService.markFormGroupTouched(this.form);

    if (this.form.valid) {
      this.loading.set(true);

      const data: ClientDetails = {
        ...this.clientDetails(),
        ...this.profile.getRawValue(),
        ...this.accountancy.getRawValue(),
        ...this.notes.getRawValue()
      }

      if (!this.clientDetails()) {
        data.clientId = 0;
      }

      GeneralService.clearObject(data);

      this.post<ClientDetails>('Clients/AddOrUpdateClient', data)
        .pipe(
          takeUntilDestroyed(this._dr),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (res) => {
            if (res.errors && res.errors.errorCode) {
              GeneralService.showErrorMessage(res.errors.message);
              return;
            }

            this.setFormData(res.data);
            this.finish.emit(res.data);
            GeneralService.showSuccessMessage();
          }
        })
    }
  }
}
