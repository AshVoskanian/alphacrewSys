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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
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
        emailAddress: [ null, [ Validators.email, Validators.required ] ],
        rateCardId: [ 8, [ Validators.required ] ],
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
        rateCardId: clientDetails.rateCardId,
        accountTypeId: clientDetails.accountTypeId,
        creditLimit: clientDetails.creditLimit,
        paymentDueDays: clientDetails.paymentDueDays,
        requiresPO: clientDetails.requiresPO,
        address: clientDetails.address,
        postcode: clientDetails.postcode,
        accountOpenDate: clientDetails.accountOpenDate,
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
        }
      }
    })
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
