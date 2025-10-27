import { Select2Data } from "ng-select2-component";

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
  checks: Select2Data;
  groups: Select2Data;
  region: Select2Data;
  pLiCover: Select2Data;
  level: Select2Data;
  classification: Select2Data;
  payMethod: Select2Data;
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


