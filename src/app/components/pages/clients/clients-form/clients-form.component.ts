import { Component, DestroyRef, inject, input, OnChanges, OnInit, output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { ApiBase } from "../../../../shared/bases/api-base";
import { GeneralService } from "../../../../shared/services/general.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { RegionsService } from "../../../../shared/services/regions.service";
import { ClientDetails } from "../../../../shared/interface/clients";
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
export class ClientsFormComponent extends ApiBase implements OnInit, OnChanges {
  private _dr: DestroyRef = inject(DestroyRef);
  private readonly _fb = inject(FormBuilder);
  private _regionsService = inject(RegionsService);

  clientDetails = input<ClientDetails>(null);

  finish = output<ClientDetails>();

  loading = signal<boolean>(false);
  regions = signal<Select2Option[]>([]);

  activeTab: string = 'profile';
  form: FormGroup;

  ngOnInit() {
    this.initForm();
    this.subToRegions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['clientDetails'] && changes['clientDetails'].currentValue) {
      this.setFormData(this.clientDetails());
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

  subToRegions() {
    this._regionsService.regions.pipe(
      takeUntilDestroyed(this._dr),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: regions => {
        this.regions.set(
          regions.filter(it => it.label !== 'All')
        );
      }
    })
  }

  initForm() {
    this.form = this._fb.group({
      profile: this._fb.group({
        companyName: [null],
        contactName: [null],
        phoneNumber: [null],
        emailAddress: [null, [Validators.email]],
        rateCardId: [null],
        accounpetTypeId: [null],
        creditLimit: [null],
        paymentDueDays: [null],
        requiresPO: [null],
        address: [null],
        postcode: [null],
        accountOpenDate: [null],
        isActive: [null],
      }),
      accountancy: this._fb.group({
        full_LegalName: [null],
        companyRegistrationNumber: [null],
        vatRegistrationNumber: [null],
        contactAccountsFirstName: [null],
        contactAccountsFullName: [null],
        contactAccountsTel: [null],
        contactAccountsEmailAddress: [null, [Validators.email]],
        contactAccountsCCEmailAddress: [null, [Validators.email]],
        creditRating: [null],
        recommendedCreditLimit: [null],
        paymentPerformance: [null],
      }),
      notes: this._fb.group({
        notes: [null],
        crewNotes: [null],
        officeNotes: [null],
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
        accounpetTypeId: clientDetails.accounpetTypeId,
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

  submit() {
    console.log(this.form.controls);
    if (this.loading()) return;

    if (this.form.valid) {
      this.loading.set(true);

      const data: ClientDetails = {
        ...this.clientDetails(),
        ...this.profile.getRawValue(),
        ...this.accountancy.getRawValue(),
        ...this.notes.getRawValue()
      }

      if (!this.clientDetails()) {
        delete data.clientId;
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
