export interface Schedule {
  address: string | null;
  companyName: string;
  crewChiefNumber: number;
  crewNotes: string;
  crewNumber: number;
  crews: Array<JobPartCrew>; // თუ გაქვს კონკრეტული ტიპი, ჩაანაცვლე
  hours: number;
  importantNotes: boolean;
  isJobActive: boolean;
  editComment?: boolean;
  editCrewNote?: boolean;
  jobId: number;
  shiftCount: number;
  shiftNumber: number;
  jobNotifications: any[]; // თუ გაქვს კონკრეტული ტიპი, ჩაანაცვლე
  jobPartId: number;
  jobPartTypeId: number;
  jobPartVenueName: string;
  jobRegionId: number;
  notes: string;
  onsiteContact: string;
  postCode: string | null;
  startDate: string;
  endDate: string;
  statusColour: string;
  statusText: string;
  vehicles: Vehicle[]; // თუ გაქვს კონკრეტული ტიპი, ჩაანაცვლე
  venueId: number;
  venueName: string;
}

export interface JobPartCrew {
  jobId?: number;
  crewId?: number;
  jobPartCrewId?: number;
  jobPartCrewRoleId?: number;
  jobPartCrewStatusId?: number;
  jobPartId?: number;
  name?: string;
  jobPartCrewStatusColour?: string;
  regionId?: number;
  isActive?: boolean;
}

export interface Vehicle {
  vehicleId: number;
  description: string;
  numberPlate: string;
}

export interface Crew {
  crewId: number;
  regionId: number;
  regionText: string;
  levelId: number;
  isFulltime: boolean;
  isChecked?: boolean;
  levelCode: string;
  levelText: string;
  levelShortText: string;
  name: string;
  skills: string;
  totalHours: number;
  rating: number;
  warnings: number;
  jobNotes: string;
}
export interface CrewActionItem {
  text: string;
  action: any;
  color: string;
  id?: number;
  icon: string;
}

export interface JobPartCrewUpdate {
  jobPartCrewId?: number;
  jobPartCrewRoleId?: number;
  jobPartCrewStatusid?: number;
}
