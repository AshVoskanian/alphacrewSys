import { Select2Option } from "ng-select2-component";

export interface CountryPhoneRule {
  code: string;            // ISO code
  name: string;
  regex: RegExp;           // validation regex
  normalize: (v: string) => string; // cleanup/normalize
}

export const MONTHS: Select2Option[] = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 }
];

export const YEARS: Select2Option[] = (() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 101 }, (_, i) => {
    const year = currentYear - i;
    return { label: year.toString(), value: year };
  });
})();


export const PHONE_COUNTRY_RULES = [
  {
    code: 'UK',
    name: 'United Kingdom',
    regex: /^(?:\+44|0)7\d{9}$/, // მაგ: +447XXXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'FR',
    name: 'France',
    regex: /^(\+33|0)[67]\d{8}$/, // მაგ: +33 6XXXXXXXX ან +33 7XXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'ES',
    name: 'Spain',
    regex: /^(\+34|0)6\d{8}$/, // მაგ: +34 6XXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'DE',
    name: 'Germany',
    regex: /^(\+49|0)1\d{9,10}$/, // მაგ: +49 1XXXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'US',
    name: 'United States',
    regex: /^\+1[2-9]\d{2}[2-9]\d{6}$/, // მაგ: +1XXXXXXXXXX ან XXXXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'PT',
    name: 'Portugal',
    regex: /^(\+351|0)?9[1236]\d{7}$/, // მაგ: +351 912345678
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'IT',
    name: 'Italy',
    regex: /^(\+39)?3\d{8,9}$/, // მაგ: +39 3XXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'CH',
    name: 'Switzerland',
    regex: /^(\+41|0)?7\d{8}$/, // მაგ: +41 7XXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'NL',
    name: 'Netherlands',
    regex: /^(\+31|0)?6\d{8}$/, // მაგ: +31 6XXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'BE',
    name: 'Belgium',
    regex: /^(\+32|0)?4\d{8}$/, // მაგ: +32 4XXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  },
  {
    code: 'AT',
    name: 'Austria',
    regex: /^(\+43|0)6\d{7,10}$/, // მაგ: +43 6XXXXXXXX ან 06XXXXXXXX
    normalize: (v: string) => v.replace(/[^+\d]/g, '')
  }
];
