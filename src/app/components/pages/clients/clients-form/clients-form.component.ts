import { Component, DestroyRef, inject, input, OnChanges, OnInit, output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2Option } from "ng-select2-component";
import { VenueDetails } from "../../../../shared/interface/venue";
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
        companyName: [null, Validators.required],
        contactName: [null, Validators.required],
        phoneNumber: [null, Validators.required],
        emailAddress: [null, Validators.required, Validators.email],
        rateCardId: [null, Validators.required],
        accounpetTypeId: [null, Validators.required],
        creditLimit: [null, Validators.required],
        paymentDueDays: [null, Validators.required],
        requiresPO: [null, Validators.required],
        address: [null, Validators.required],
        postcode: [null, Validators.required],
        accountOpenDate: [null, Validators.required],
        isActive: [null, Validators.required],
      }),
      accountancy: this._fb.group({
        quickBooksId: [null],
        qboId: [null],
        qbLastModified: [null],
        full_LegalName: [null],
        contactAccountsFirstName: [null],
        contactAccountsFullName: [null],
        contactAccountsEmailAddress: [null],
        contactAccountsCCEmailAddress: [null],
        contactAccountsTel: [null],
        creditRating: [null],
        paymentPerformance: [null],
        recommendedCreditLimit: [null],
        companyRegistrationNumber: [null],
        vatRegistrationNumber: [null],
      }),
      notes: this._fb.group({})
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
        quickBooksId: clientDetails.quickBooksId,
        qboId: clientDetails.qboId,
        qbLastModified: clientDetails.qbLastModified,
        full_LegalName: clientDetails.full_LegalName,
        contactAccountsFirstName: clientDetails.contactAccountsFirstName,
        contactAccountsFullName: clientDetails.contactAccountsFullName,
        contactAccountsEmailAddress: clientDetails.contactAccountsEmailAddress,
        contactAccountsCCEmailAddress: clientDetails.contactAccountsCCEmailAddress,
        contactAccountsTel: clientDetails.contactAccountsTel,
        creditRating: clientDetails.creditRating,
        paymentPerformance: clientDetails.paymentPerformance,
        recommendedCreditLimit: clientDetails.recommendedCreditLimit,
        companyRegistrationNumber: clientDetails.companyRegistrationNumber,
        vatRegistrationNumber: clientDetails.vatRegistrationNumber,
      }
    });

    this.form.updateValueAndValidity();
  }

  submit() {
    console.log(this.form.controls);
    return;
    if (this.loading()) return;

    if (this.form.valid) {
      this.loading.set(true);

      const data: VenueDetails = {
        ...this.clientDetails(),
        ...this.form.getRawValue()
      }

      if (!this.clientDetails()) {
        delete data.venueId;
      }

      GeneralService.clearObject(data);

      this.post<VenueDetails>('Venues/AddOrUpdateVenue', data)
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

            // this.setFormData(res.data);
            // this.finish.emit(res.data);
            // GeneralService.showSuccessMessage();
          }
        })
    }
  }
}
