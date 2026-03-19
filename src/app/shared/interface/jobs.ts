export interface JobResponse {
  jobIndex: Job[];
  rowCount: number;
}

export interface Job {
  jobId: number;
  clientId: number;
  companyName: string;
  company_venue?: string;
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

export interface Currency {
  id: number;
  code: string;
  name: string;
  sign: string;
}

export interface JobDetails {
  jobId: number;
  quickBooksId: number | null;
  qboId: number | null;
  clientId: number;
  venueId: number;
  jobRegionId: number;
  jobRateCardId: number | null;
  clientRateCardId: number | null;
  statusId: number;
  dateCreated: string;
  dateEdited: string;
  invoiceDate: string;
  paidDate: string;
  paymentDueDate: string;
  gid: string;
  purchaseOrder: string | null;
  invoiceNumber: string | null;
  editedBy: string;
  orderedBy: string;
  jobContact: string;
  vatRateId: number;
  vat: boolean;
  prePayment: number;
  discount: number;
  discountPercent: number | null;
  paymentTypeId: number | null;
  numberOfJobParts: number | null;
  importantDate: string;
  currencyId: number | null;
  regionCurrencyId: number | null;
  publish: boolean;
  notes: string;
  updateHistory: unknown | null;
  revision: number;
  venue: string;
  jobCost: JobCost;
  clientLimit: ClientLimit;
  jobParts: JobPart[];
  jobRegionAccess: unknown[];
  documents: JobDocument[];
  partialPayments: PartialPayment[];
}

export interface PartialPayment {
  partialPaymentId: number;
  jobId: number;
  amount: number;
  paidDate: string;
  updatedBy: string;
  updatedDate: string;
  comments: string | null;
}

export interface JobDocument {
  fileName: string;
}

export interface JobCost {
  net: number;
  vat: number;
  partialPayment: number;
  gross: number;
  outstanding: number;
}

export interface AddPaymentResponse {
  jobCost?: JobCost;
  partialPayments: PartialPayment[];
}

export interface JobPartResponse {
  jobCost?: JobCost;
  jobJobPartResponses: JobPart[];
}

export interface JobPart {
  jobPartId: number;
  jobId: number;
  jobPartTypeId: number;
  typeText: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  hours: number;
  starts: string;
  time: string;
  ends: string;
  crewNumber: number;
  crewChiefNumber: number;
  ootCost: number;
  lateShiftCost: number;
  lateShift: boolean;
  currencyId: number;
  currencyName: string;
  currencySign: string;
  skillDriver: boolean;
  skillForklift: boolean;
  skillIpaf: boolean;
  skillSafety: boolean;
  skillConstruction: boolean;
  skillCarpenter: boolean;
  skillLightning: boolean;
  skillSound: boolean;
  skillVideo: boolean;
  skillTfm: boolean;
  skillTelehandler: boolean;
  skillScissorlift: boolean;
  skillCherrypicker: boolean;
  skillFirstAid: boolean;
  skillPasma: boolean;
  skillFollowspot: boolean;
  quoteCost: number;
  quoteCostVat: number;
  warnings: JobScheduleWarning;
}

export interface JobPartTypeItem {
  jobPartTypeId?: number;
  id?: number;
  typeText?: string;
  name?: string;
}

export interface ClientLimit {
  creditLimit: number;
  creditRating: number;
  recommendedCreditLimit: number;
  clientUtilisation: number;
}

/** Request body for POST Jobs/AddOrUpdateJobPart */
export interface JobPartRateCard {
  crewRate: number;
  crewChiefSupplement: number;
  extraHour: number;
  skillSupplement: number;
  milage: number;
}

/** Item in jobPartSkillsAddRequests (add/update skills with count). */
export interface JobPartSkillAddRequest {
  skillId: number;
  count: number;
}

export interface AddOrUpdateJobPartRequest {
  jobPartId: number;
  jobId: number;
  jobPartTypeId: number;
  eventId: string;
  jobPartVenueName: string;
  jobPartVenuePostcode: string;
  alphaDrivers: number;
  startDate: string;
  endDate: string;
  crewNumber: number;
  crewChiefNumber: number;
  ccSupplement: number;
  quoteCost: number;
  extraCrew: number;
  extraHours: number;
  extraCost: number;
  ootCost: number;
  travelHours: number;
  travelHoursCost: number;
  lateShiftCost: number;
  returnMileage: number;
  misc: string;
  miscCost: number;
  fuel: number;
  fuelCost: number;
  fuelCostCrew: number;
  notes: string;
  crewNotes: string;
  skillsNotes: string;
  paperworkNotes: string;
  importantNotes: boolean;
  lateChange: boolean;
  jobPartNumber: number;
  jobPartHours: number;
  jobPartSkillsAddRequests: JobPartSkillAddRequest[];
  skillSupplement: number;
  onsiteContact: string;
  editedBy?: string;
  lastModified?: string;
  updateHistory?: string;
  revision?: number;
  rateCard?: JobPartRateCard;
}

/** Job part skill returned in GET Jobs/GetJobPart (jobPartSkills). */
export interface JobPartSkillItem {
  id: number;
  jobId: number;
  jobPartId: number;
  skillId: number;
  count: number;
  createDate: string;
}

/** Response of GET Jobs/GetJobPart (API may return null for some fields). */
export interface JobPartDetailsResponse {
  jobPartId: number;
  jobId: number;
  jobPartTypeId: number;
  eventId: string | null;
  jobPartVenueName: string;
  jobPartVenuePostcode: string;
  alphaDrivers: number;
  startDate: string;
  endDate: string;
  crewNumber: number;
  crewChiefNumber: number;
  ccSupplement: number;
  quoteCost: number;
  extraCrew: number;
  extraHours: number;
  extraCost: number;
  ootCost: number;
  travelHours: number;
  travelHoursCost: number;
  lateShiftCost: number;
  returnMileage: number;
  misc: string;
  miscCost: number;
  fuel: number | null;
  fuelCost: number;
  fuelCostCrew: number;
  notes: string;
  crewNotes: string;
  skillsNotes: string;
  paperworkNotes: string;
  importantNotes: boolean;
  lateChange: boolean | null;
  jobPartNumber: number | null;
  jobPartHours: number | null;
  jobPartSkills?: JobPartSkillItem[];
  skillSupplement: number;
  onsiteContact: string;
  editedBy?: string;
  lastModified?: string;
  updateHistory?: string;
  revision?: number;
  rateCard?: JobPartRateCard;
}


export interface JobScheduleWarning {
  crew: number;
  hour: number;
  jobPartId: number;
  limit: number;
  status: number;
  times: string;
  warning: number;
  weekDay: number;
}
