import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString
} from 'libphonenumber-js';

export interface PhoneCountryOption {
  iso2: CountryCode;
  name: string;
  dialCode: string;
  label: string;
  flagClass: string;
}

/** Shown first in the dropdown when present. */
const PREFERRED_PHONE_COUNTRIES: CountryCode[] = [
  'GB', 'US', 'FR', 'ES', 'DE', 'PT', 'IT', 'CH', 'NL', 'BE', 'AT'
];

const regionNames = typeof Intl !== 'undefined'
  ? new Intl.DisplayNames([ 'en' ], { type: 'region' })
  : null;

function countryName(iso2: CountryCode): string {
  return regionNames?.of(iso2) ?? iso2;
}

function buildCountryOption(iso2: CountryCode): PhoneCountryOption {
  const dialCode = getCountryCallingCode(iso2);
  return {
    iso2,
    name: countryName(iso2),
    dialCode,
    label: `+${dialCode}`,
    flagClass: `flag-icon flag-icon-${iso2.toLowerCase()}`
  };
}

export const PHONE_COUNTRIES: PhoneCountryOption[] = (() => {
  const preferredIndex = new Map(PREFERRED_PHONE_COUNTRIES.map((code, i) => [ code, i ]));

  return getCountries()
    .map(buildCountryOption)
    .sort((a, b) => {
      const aPref = preferredIndex.has(a.iso2) ? preferredIndex.get(a.iso2)! : Number.POSITIVE_INFINITY;
      const bPref = preferredIndex.has(b.iso2) ? preferredIndex.get(b.iso2)! : Number.POSITIVE_INFINITY;
      if (aPref !== bPref) return aPref - bPref;
      return a.name.localeCompare(b.name);
    });
})();

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'GB';

export function getPhoneCountry(iso2: CountryCode): PhoneCountryOption | undefined {
  return PHONE_COUNTRIES.find((c) => c.iso2 === iso2);
}

export function formatPhoneE164(nationalOrRaw: string, country: CountryCode): string | null {
  const trimmed = nationalOrRaw?.trim();
  if (!trimmed) return null;

  const parsed = parsePhoneNumberFromString(trimmed, country);
  if (!parsed?.isValid()) return null;

  return parsed.format('E.164');
}

export function isPhoneValid(value: string, country?: CountryCode): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  return country ? isValidPhoneNumber(trimmed, country) : isValidPhoneNumber(trimmed);
}

export function parseStoredPhone(value: string): { country: CountryCode; national: string } | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const parsed =
    parsePhoneNumberFromString(trimmed) ??
    parsePhoneNumberFromString(trimmed, DEFAULT_PHONE_COUNTRY);

  if (!parsed) return null;

  const country = parsed.country ?? DEFAULT_PHONE_COUNTRY;
  const supported = PHONE_COUNTRIES.some((c) => c.iso2 === country);

  return {
    country: supported ? country : DEFAULT_PHONE_COUNTRY,
    national: parsed.nationalNumber
  };
}
