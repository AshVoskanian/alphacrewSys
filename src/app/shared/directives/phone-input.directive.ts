import { Directive, ElementRef, EventEmitter, forwardRef, HostListener, Input, OnInit, Output } from '@angular/core';
import { CountryPhoneRule, PHONE_COUNTRY_RULES } from '../utils/date';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[phoneInput]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneInputDirective),
      multi: true
    }
  ]
})
export class PhoneInputDirective implements OnInit, Validator {

  @Input('phoneCountries') countryCodes: string[] = [];
  @Output() invalidPhone = new EventEmitter<string>();
  @Output() validPhoneAdded = new EventEmitter<string>();
  @Output() isValidChange = new EventEmitter<boolean>();

  private countries: CountryPhoneRule[] = [];

  constructor(private el: ElementRef<HTMLInputElement>) {
  }

  ngOnInit() {
    this.countries = PHONE_COUNTRY_RULES.filter(c =>
      this.countryCodes.length === 0 || this.countryCodes.includes(c.code)
    );

    setTimeout(() => {
      this.processInitialValue();
    });
  }

  private processInitialValue() {
    const value = this.el.nativeElement.value.trim();
    if (!value) {
      this.isValidChange.emit(true);
      return;
    }

    if (value.endsWith(';') || value.endsWith('; ')) {
      this.isValidChange.emit(this.validatePhones(value));
      return;
    }

    for (const country of this.countries) {
      const cleaned = country.normalize(value);
      if (country.regex.test(cleaned)) {
        this.el.nativeElement.value = cleaned + '; ';
        this.validPhoneAdded.emit(cleaned);
        this.isValidChange.emit(true);
        this.el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }

    this.isValidChange.emit(false);
  }

  @HostListener('keydown', [ '$event' ])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      const value = this.el.nativeElement.value;

      // If ends with "; " → delete both chars
      if (value.endsWith('; ')) {
        e.preventDefault();
        this.el.nativeElement.value = value.slice(0, -2);
        return;
      }

      // If ends with ";" → delete semicolon
      if (value.endsWith(';')) {
        e.preventDefault();
        this.el.nativeElement.value = value.slice(0, -1);
        return;
      }
    }
  }

  @HostListener('input')
  onInput() {
    let value = this.el.nativeElement.value;

    // remove spaces before processing but leave semicolons
    const cleanedValue = value.replace(/ /g, '');

    // get last segment (after last semicolon)
    const parts = cleanedValue.split(';').map(v => v.trim());
    const last = parts[parts.length - 1];

    const isValid = this.validatePhones(this.el.nativeElement.value);
    this.isValidChange.emit(isValid);

    // already ends with semicolon → no need to auto-add
    if (value.trim().endsWith(';')) return;
    if (value.trim().endsWith('; ')) return;

    // try validate last segment for every configured country
    for (const country of this.countries) {
      const cleanedLast = country.normalize(last);

      if (country.regex.test(cleanedLast)) {
        // append semicolon only for the last number
        this.el.nativeElement.value = cleanedValue + '; ';
        this.validPhoneAdded.emit(cleanedLast);
        return;
      }
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    const isValid = this.validatePhones(value);
    return isValid ? null : { phoneInvalid: true };
  }

  validatePhones(value: string): boolean {
    if (!value.trim()) return true; // empty is valid

    const rawParts = value.split(';').map(v => v.trim());

    // Loop over all parts EXCEPT last empty trailing part
    const lastIsEmptyAndEndsWithComma =
      value.trim().endsWith(';') || value.trim().endsWith('; ');

    const partsToCheck = lastIsEmptyAndEndsWithComma
      ? rawParts.slice(0, -1)   // do not validate unfinished last number
      : rawParts;               // validate all normally

    // If all parts except last are empty → invalid
    if (partsToCheck.length === 0) return false;

    for (const part of partsToCheck) {
      if (!part) return false; // empty between commas → invalid

      let isValidForAnyCountry = false;

      for (const country of this.countries) {
        const cleaned = country.normalize(part);
        if (country.regex.test(cleaned)) {
          isValidForAnyCountry = true;
          break;
        }
      }

      if (!isValidForAnyCountry) return false;
    }

    return true;
  }
}
