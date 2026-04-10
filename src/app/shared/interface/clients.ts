export interface Client {
  clientId: number;
  companyName: string;
  contactName: string;
  postcode: string;
  emailAddress: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface ClientIndexResponse {
  rowCount: number;
  clientIndex: Client[];
}

export interface ClientDetails {
  clientId: number;

  quickBooksId: number | null;
  qboId: number | null;
  qbLastModified: string | null;

  companyName: string;
  full_LegalName: string;

  contactName: string;
  contactFirstName: string | null;

  accountOpenDate: string | null;

  contactAccountsFirstName: string | null;
  contactAccountsFullName: string | null;
  contactAccountsEmailAddress: string;
  contactAccountsCCEmailAddress: string;
  contactAccountsTel: string | null;

  phoneNumber: string;
  emailAddress: string;

  rateCardId: number;
  rateCardDescription: string;

  creditLimit: number;
  paymentDueDays: number;
  requiresPO: boolean;

  creditRating: number;
  paymentPerformance: number;
  recommendedCreditLimit: number;

  address: string;
  postcode: string;

  notes: string;
  crewNotes: string;
  officeNotes: string;

  po: string | null;

  companyRegistrationNumber: string;
  vatRegistrationNumber: string | null;

  accounpetTypeId: number;
  accountType: string;
  accountTypeId: number;

  isActive: boolean;
}

export interface ClientSearchParams {
  searchKey?: string;
  active?: number;
  clientId?: number;
  page: number;
  pageSize: number;
}

export interface RateCard {
  rateCardId: number;
  description: string;
}

export interface AccountType {
  accountTypeId: number;
  accountTypeText: string;
}
