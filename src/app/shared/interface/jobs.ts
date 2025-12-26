export interface JobResponse {
  jobIndex: Job[];
  rowCount: number;
}

export interface Job {
  jobId: number;
  clientId: number;
  companyName: string;
  purchaseOrder: string | null;
  requiresPO: boolean;
  venueName: string;
  statusText: string;
  statusContent: string;
  statusColour: string;
  statusId: number;
  paidDate: string | null;
  paidDateString: string;
  regionText: string;
  overdue: '0' | '1' | string;
  parts: number;
  starts: string; // ISO date
  ends: string;   // ISO date
  totalHours: number;
  cost: number;
}

export interface JobSearchParams {
  searchKey?: string;
  region?: number;
  statusId?: number;
  active?: number;
  jobId?: number;
  page?: number;
  pageSize?: number;
}

export interface JobVenue {
  jobs: number;
  venueId: number;
  venueName: string;
}

export interface JobClient {
  clientId: number;
  companyName: string;
  isActive: boolean;
}

export interface JobDetails {
  jobId: number;
  quickBooksId: number;
  qboId: number;
  clientId: number;
  venueId: number;
  jobRegionId: number;
  jobRateCardId: number;
  statusId: number;

  dateCreated: string;
  dateEdited: string;
  invoiceDate: string;
  paidDate: string;
  paymentDueDate: string;
  importantDate: string;

  purchaseOrder: string;
  invoiceNumber: string;
  editedBy: string;
  orderedBy: string;
  jobContact: string;

  vatRateId: number;
  prePayment: number;
  discount: number;
  discountPercent: number;
  paymentTypeId: number;

  numberOfJobParts: number;
  currencyId: number;

  publish: boolean;

  notes: string;
  updateHistory: string;
  revision: number;

  venue: string;
}
