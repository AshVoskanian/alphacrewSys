export interface Schedule {
  address: string | null;
  companyName: string;
  crewChiefNumber: number;
  crewNotes: string;
  crewNumber: number;
  crews: JobPartCrew[]; // თუ გაქვს კონკრეტული ტიპი, ჩაანაცვლე
  hours: number;
  importantNotes: boolean;
  isJobActive: boolean;
  jobId: number;
  shiftCount: number;
  shiftNumber: number;
  jobNotifications: any[]; // თუ გაქვს კონკრეტული ტიპი, ჩაანაცვლე
  jobPartId: number;
  jobPartTypeId: number;
  jobPartVenueName: string;
  jobRegionId: number;
  notes: string | null;
  onsiteContact: string;
  postCode: string | null;
  startDate: string; // თუ `Date` ტიპით გინდა, გამოიყენე `Date`
  statusColour: string;
  statusText: string;
  vehicles: any[]; // თუ გაქვს კონკრეტული ტიპი, ჩაანაცვლე
  venueId: number;
  venueName: string;
}

export interface JobPartCrew {
  jobId: number;
  crewId: number;
  jobPartCrewId: number;
  jobPartCrewRoleId: number;
  jobPartCrewStatusId: number;
  jobPartId: number;
  name: string;
  regionId: number;
}
