import { Directive, ElementRef, EventEmitter, forwardRef, HostListener, Input, OnInit, Output } from '@angular/core';
import { CountryPhoneRule, PHONE_COUNTRY_RULES } from "../utils/date";
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from "@angular/forms";

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
  @Output() invalidPhone = new EventEmitter<string>(); // bad number
  @Output() validPhoneAdded = new EventEmitter<string>(); // good number
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
    if (!value) return;

    if (value.endsWith(';') || value.endsWith('; ')) return;

    for (const country of this.countries) {
      const cleaned = country.normalize(value);
      if (country.regex.test(cleaned)) {
        this.el.nativeElement.value = cleaned + '; ';
        this.validPhoneAdded.emit(cleaned);
        return;
      }
    }
  }

  @HostListener('keydown', [ '$event' ])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      const value = this.el.nativeElement.value;

      // If ends with ", " → delete both chars
      if (value.endsWith('; ')) {
        e.preventDefault();
        this.el.nativeElement.value = value.slice(0, -2);
        return;
      }

      // If ends with "," → delete comma
      if (value.endsWith(';')) {
        e.preventDefault();
        this.el.nativeElement.value = value.slice(0, -1);
        return;
      }
    }
  }

  // ******** INPUT *********
  @HostListener('input')
  onInput() {
    let value = this.el.nativeElement.value;

    // remove spaces before processing but leave commas
    const cleanedValue = value.replace(/ /g, '');

    // get last segment (after last comma)
    const parts = cleanedValue.split(';').map(v => v.trim());
    const last = parts[parts.length - 1];

    const isValid = this.validatePhones(this.el.nativeElement.value);
    this.isValidChange.emit(isValid);

    // already ends with comma → no need to auto-add
    if (value.trim().endsWith(';')) return;
    if (value.trim().endsWith('; ')) return;

    // try validate last segment for every configured country
    for (const country of this.countries) {
      const cleanedLast = country.normalize(last);

      if (country.regex.test(cleanedLast)) {
        // append comma only for the last number
        this.el.nativeElement.value = cleanedValue + '; ';
        this.validPhoneAdded.emit(cleanedLast);
        return;
      }
    }
  }

  // // ******** PASTE *********
  // @HostListener('paste', [ '$event' ])
  // onPaste(e: ClipboardEvent) {
  //   e.preventDefault();
  //
  //   let text = e.clipboardData?.getData('text')?.trim() ?? '';
  //   text = text.replace(/\s+/g, '');
  //
  //   const parts = text
  //     .split(/[; \n]/)
  //     .map(v => v.trim())
  //     .filter(Boolean);
  //
  //   let output = '';
  //
  //   for (const part of parts) {
  //     let isValid = false;
  //
  //     for (const country of this.countries) {
  //       const cleaned = country.normalize(part); // +44 7123214111 -> +447123214111
  //
  //       if (country.regex.test(cleaned)) {
  //         output += cleaned + '; '; // გამოიყენე სუფთა normalize ნომერი
  //         this.validPhoneAdded.emit(cleaned);
  //         isValid = true;
  //         break;
  //       }
  //     }
  //
  //     if (!isValid) {
  //       this.invalidPhone.emit(part);
  //     }
  //   }
  //
  //   this.el.nativeElement.value = (this.el.nativeElement.value + output).trim();
  //   this.el.nativeElement.dispatchEvent(new Event('input'));
  // }

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
