import { Select2Data, Select2Option } from "ng-select2-component";

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


