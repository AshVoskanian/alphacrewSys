import { CrewIndex } from "./crew";

export interface Venue {
  venueId: number;
  venueName: string;
  address: string | null;
  postCode: string;
  regionText: string;
  milage: number;
  notes: string;
  importantNotes: string | null;
  onSiteContact: string;
  onSiteContact2: string;
  temporaryEntry: boolean;
}

export interface VenueIndexResponse {
  rowCount: number;
  venueIndex: Venue[];
}

export interface VenueDetails {
  venueId: number;
  venueName: string;
  regionId: number;

  oot: number | null;
  drivingBonus: number | null;

  onSiteContact: string | null;
  onSiteContact2: string | null;

  address: string | null;
  postCode: string | null;

  milage: number | null;

  notes: string | null;
  crewNotes: string | null;
  officeNotes: string | null;
  importantNotes: string | null;

  riskAssessment: string | null;

  temporaryEntry: boolean;

  duplicateOf: number | null;

  regionText: string;
}

export interface VenueSearchParams {
  searchKey?: string;
  includeTemporary?: number;
  venueId?: number;
  page: number;
  pageSize: number;
}
