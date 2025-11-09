import { Select2Option } from "ng-select2-component";

export interface CrewIndexResponse {
  rowCount: number;
  crewIndex: CrewIndex[];
}

export interface CrewIndex {
  avgRating: number;
  checksId: number;
  classText: string;
  completed: number;
  crewId: number;
  daysRemaining: number;
  doB: string;
  email: string;
  isActive: boolean;
  levelText: string;
  name: string;
  paymentOptionText: string;
  payrollEmail: string;
  phoneNumber: string;
  pliRequired: boolean;
  postcode: string;
  ratings: number;
  regionText: string;
  hours?: string;
  roundAvgRating: number;
  scheduled: number;
  warnings: number;
}

export interface FilterDropdowns {
  checks: Select2Option[];
  groups: Select2Option[];
  region: Select2Option[];
  pLiCover: Select2Option[];
  level: Select2Option[];
  classification: Select2Option[];
  payMethod: Select2Option[];
}

export interface CrewSearchParams {
  searchKey?: string;
  acive?: number;
  crewLevel?: number;
  crewRegion?: number;
  paymentOption?: number;
  classification?: number;
  page: number;
  pageSize: number;
}

export interface CrewSkill {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CrewDetail {
  crewId: number;
  name: string;
  levelText: string;
  regionText: string;
  regionId: number;
  groupId: number;
  classificationId: number;
  vaccinationStatus: string | null;
  login: string;
  password: string;
  jobNotes: string;
  address: string;
  postcode: string;
  phoneNumber: string;
  email: string;
  payrollEmail: string;
  payrollRef: string | null;
  doB: string;              // ISO string: e.g. "2018-09-20T00:00:00"
  startDate: string;        // ISO string
  checksId: number;
  documents: string;
  ltdCompanyName: string | null;
  ltdCompanyNumber: string | null;
  utrNumber: string | null;
  ninNumber: string | null;
  pliProvides: string | null;
  pliExpiry: string | null;
  pliCoverId: string | null;
  levelId: number;
  loyaltyBonus: number;
  paymentOptionId: number;
  rating: number;
  availability: string | null;
  availabilityFlag: string | null;
  isFulltime: boolean;
  isActive: boolean;
  deactivationDate: string | null;
  onFurlough: boolean;
  phoneNumbere164: string;
  useWhatsapp: boolean | null;
  useEmail: boolean | null;
  useSms: boolean | null;
  crewSkills: CrewSkill[];
  crewSkillIds: number[];
  crewAllSkills: CrewSkill[];
}

export interface CrewNote {
  crewNoteId: number;
  crewId: number;
  crewNoteDate: string;
  note: string;
  enteredBy: string;
  lastModifiedDate: string;
}

export interface CrewNoteInput {
  crewNoteId?: number,
  crewId: number,
  crewNoteDate: string,
  note: string,
  enteredBy?: string,
  lastModifiedDate?: string
}

export interface CrewHoliday {
  crewHolidayId?: number;
  crewId: number;
  holidayStart: string;
  holidayEnd: string;
  comments: string;
}

export interface CrewFeedback {
  ratingId: number;
  early: number;
  presentation: number;
  teamwork: number;
  professionalism: number;
  attitude: number;
  modifiedBy: string;
  modifiedDate: string;
  rating: number;
  ratingtext: string;
}

export interface CrewPayment {
  crewPayId?: number;
  crewId: number;
  payDate: string;
  payAmount: number;
  comments: string | null;
}

export interface CrewAdjustment {
  adjustmentId: number;
  crewId: number;
  amount: number;
  adjustmentDate: string;
  description: string;
  enteredBy?: string;
  lastModifiedDate?: string;
}

