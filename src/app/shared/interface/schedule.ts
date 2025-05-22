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
  isNightShift: boolean;
  isNigthShiftPaid: boolean;
  showNotifications: boolean;
  notificationsLoader: boolean;
  vehicleLoader: boolean;
  editComment?: boolean;
  editCrewNote?: boolean;
  isJobScoped?: boolean;
  jobId: number;
  shiftCount: number;
  notificationCount: number;
  shiftNumber: number;
  jobNotifications: any[]; // თუ გაქვს კონკრეტული ტიპი, ჩაანაცვლე
  jobPartId: number;
  jobPartTypeId: number;
  jobPartVenueName: string;
  jobRegionId: number;
  statusId: number;
  ootCost: number;
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
  notifications: Array<Notification>;
}

export interface JobPartCrew {
  jobId?: number;
  crewId?: number | unknown;
  jobPartCrewId?: number;
  jobPartCrewRoleId?: number;
  jobPartCrewStatusId?: number;
  jobPartId?: number;
  name?: string;
  jobPartCrewStatusColour?: string;
  regionId?: number;
  levelId?: number;
  isActive?: boolean;
  loading?: boolean;
  editLoading?: boolean;
}

export interface Crew extends CrewManager{
  crewId: number;
  regionId: number;
  regionText: string;
  levelId: number;
  isFulltime: boolean;
  isChecked?: boolean;
  notificationLoading?: boolean;
  levelCode: string;
  levelText: string;
  levelShortText: string;
  name: string;
  skills: string;
  totalHours: number;
  notClashingInfo: {
    unassignedCrewCount: number;
    details: Record<number, number>;
  }
  rating: number;
  warnings: number;
  jobNotes: string;
  jobPartIds: Array<number>
  crewSkills: CrewSkill[];
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

export interface JobPartCrewEdit {
  bonus: number | null;
  crewId: number;
  expences: number;
  extraHours: number | null;
  jobPartCrewId: number;
  jobPartCrewRoleId: number;
  jobPartCrewRoleText: string;
  jobPartCrewStatusColourMvc: string;
  jobPartCrewStatusId: number;
  jobPartCrewStatusText: string;
  lastMinuteBonus: number;
  lateShiftCost: number;
  levelShortText: string;
  name: string;
  ootCost: number;
  otherPaymentAdjustment: number;
  otherPaymentAdjustmentTxt: string;
  pay: number;
  postcode: string;
  skilledCost: number | null;
  travelHoursCost: number;
  crewNumber: number;
  crewChiefNumber: number;
  crewSkills: CrewSkill[];
  jobPartSkills: CrewSkill[];
}

export interface CrewSkill {
  crewSkillId: number;
  crewSkillText: string;
  crewSkillAbbr: string;
  isPublic: boolean;
  checked?: boolean;
  description: string;
}

export interface Notification {
  jobId: number;
  jobPartId: number;
  status: number;
  sentDate: string;
  sentBy: string;
  name: string;
  crewId: number;
}

export interface CrewManager {
  conflict: number;
  crewHours: number;
  crewID: number;
  holiday: number;
  struckOut: number;
  turnedDown: number;
}


export interface JobPartClashing {
  assignedCrew: number | null;
  bookedCrew: number;
  crewClashingList: CrewClashing[];
  hours: number;
  jobId: number;
  jobPartId: number;
  startDate: string;
  checked: boolean;
}

export interface CrewClashing {
  jobPartId: number;
  crewId: number;
  clashing: boolean;
}


export interface Vehicle {
  vehicleText: string;
  icon: string;
  fontAwsome: string;
  clashes: boolean;
  vehicleId: number;
  description: string;
  numberPlate: string;
  loading: boolean;
  active: boolean
}
