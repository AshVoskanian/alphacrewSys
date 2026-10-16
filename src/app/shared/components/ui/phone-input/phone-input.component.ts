import { Component, computed, ElementRef, forwardRef, HostListener, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { CountryCode } from 'libphonenumber-js';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneE164,
  getPhoneCountry,
  isPhoneValid,
  parseStoredPhone,
  PHONE_COUNTRIES,
  PhoneCountryOption
} from '../../../utils/phone.utils';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [ FormsModule ],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ]
})
export class PhoneInputComponent implements ControlValueAccessor, Validator {
  private readonly host = inject(ElementRef<HTMLElement>);

  countries = input<PhoneCountryOption[]>(PHONE_COUNTRIES);

  country = signal<CountryCode>(DEFAULT_PHONE_COUNTRY);
  nationalNumber = signal('');
  disabled = signal(false);
  dropdownOpen = signal(false);
  countrySearch = signal('');

  selectedCountry = computed(() =>
    getPhoneCountry(this.country()) ?? this.countries()[0]
  );

  filteredCountries = computed(() => {
    const query = this.countrySearch().trim().toLowerCase();
    const list = this.countries();
    if (!query) return list;

    return list.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.iso2.toLowerCase().includes(query) ||
      item.label.includes(query) ||
      item.dialCode.includes(query.replace('+', ''))
    );
  });

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  @HostListener('document:click', [ '$event' ])
  onDocumentClick(event: MouseEvent): void {
    if (!this.dropdownOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.dropdownOpen.set(false);
      this.countrySearch.set('');
    }
  }

  writeValue(value: string | null): void {
    if (!value) {
      this.country.set(DEFAULT_PHONE_COUNTRY);
      this.nationalNumber.set('');
      return;
    }

    const parsed = parseStoredPhone(value);
    if (parsed) {
      this.country.set(parsed.country);
      this.nationalNumber.set(parsed.national);
      return;
    }

    this.country.set(DEFAULT_PHONE_COUNTRY);
    this.nationalNumber.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) {
      this.dropdownOpen.set(false);
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string | null;
    if (!value) return null;

    return isPhoneValid(value) ? null : { phoneInvalid: true };
  }

  toggleDropdown(): void {
    if (this.disabled()) return;

    const next = !this.dropdownOpen();
    this.dropdownOpen.set(next);
    if (!next) {
      this.countrySearch.set('');
    }
  }

  selectCountry(iso2: CountryCode): void {
    this.country.set(iso2);
    this.dropdownOpen.set(false);
    this.countrySearch.set('');
    this.emitValue();
    this.onTouched();
    this.onValidatorChange();
  }

  onNationalInput(value: string): void {
    this.nationalNumber.set(value);
    this.emitValue();
  }

  onBlur(): void {
    this.onTouched();
  }

  private emitValue(): void {
    const national = this.nationalNumber().trim();
    if (!national) {
      this.onChange(null);
      this.onValidatorChange();
      return;
    }

    const e164 = formatPhoneE164(national, this.country());
    this.onChange(e164 ?? national);
    this.onValidatorChange();
  }
}
