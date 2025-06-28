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
  noteType?: 'job_note' | 'crew_note';
  updateLoading?: boolean;
  isJobScoped?: boolean;
  changed?: boolean;
  jobId: number;
  shiftCount: number;
  notificationCount: number;
  roles: string;
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
  jobPartSkills: ScheduleSkills;
  transformedSkills: TransformedSkill[];
  editedBy: string;
  lastModified: string;
  messageStatus: number;
  smsStatusColour: string;
  smsStatusTitle: string;
  icon?:string;
  iconColor?:string;
}

export interface TransformedSkill {
  active: any;
  url: any;
  name: string;
}

export interface ScheduleSkills {
  skillDriver: boolean;
  skillForklift: boolean;
  skillIpaf: boolean;
  skillIpaf3b: boolean | null;
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
  skillAudioTech: boolean | null;
  skillRoughTerrainForklift: boolean | null;
  skillHealhAndSafety: boolean | null;
  skillWorkingAtHeight: boolean | null;
}

export interface JobPartCrew extends JobPartCrewAdditionalDetail{
  jobId?: number;
  crewId?: number | unknown;
  jobPartCrewId?: number;
  jobPartCrewRoleId?: number;
  jobPartCrewStatusId?: number;
  jobPartId?: number;
  levelCrewingWeighting?: number;
  name?: string;
  jobPartCrewStatusColour?: string;
  regionId?: number;
  levelId?: number;
  isActive?: boolean;
  loading?: boolean;
  detailsLoading?: boolean;
  editLoading?: boolean;
}

export interface Crew extends CrewManager {
  crewId: number;
  regionId: number;
  regionText: string;
  levelId: number;
  levelCrewingWeighting: number;
  isFulltime: boolean;
  isChecked?: boolean;
  isCheckedForSMS?: boolean;
  notificationLoading?: boolean;
  detailsLoading?: boolean;
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
  jobPartCrewId: number;
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
  href?: string;
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
  notificationStatusId: number;
  notificationStatusText: string;
  cssColour: string;
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


export interface ScheduleSmsInfo {
  companyName: string;
  venueName: string;
  jobPartVenueName: string;
  address: string;
  postcode: string;
  startDay: string;
  startDate: number;
  startMonth: string;
  startYear: number;
  startTime: string;
  endTime: string;
  vehicles: string;
  crew: string;
  teamLead: string;
  crewChiefs: string;
}

export interface ShiftCrewDetails {
  role: number;
  roleName: string;
  status: number;
  jpStartDateTime: string;
  jpEndDateTime: string;
  startTime: string;
  endTime: string;
  thisJPStart: string;
  jpStart: string;
  startdate: string;
  endDate: string;
  client: string;
  altVenue: string;
  venue: string;
  postCode: string;
  extraHours: number;
  skilledCost: number;
  jobPartId: number;
  bonus: number;
  lastMinuteBonus: number;
  drivingBonus: number;
  otherPaymentAdjustment: number;
  otherPaymentAdjustmentTxt: string;
  updateHistory: string;
  jobPartCrewStatusColourMvc: string;
  jobPartCrewStatusText: string;
}

export interface JobMessageStatus {
  jobId: number;
  messageStatus: number;
  smsStatusColour: string;
  smsStatusTitle: string;
  onsiteContact: string;
  lastModified: string;
  editedBy: string;
}

export interface CrewDetailForShift {
  role: number;
  status: number;
  jpStartDateTime: string;
  jpEndDateTime: string;
  roleName: string;
  startTime: string;
  endTime: string;
  thisJPStart: string;
  jpStart: string;
  startdate: string;
  endDate: string;
  client: string;
  altVenue: string;
  venue: string;
  postCode: string;
  extraHours: number;
  jobPartId: number;
  skilledCost: number;
  bonus: number;
  updateHistory: string;
  jobPartCrewStatusColourMvc: string;
  jobPartCrewStatusText: string;
}

export interface BonusResponse {
  pay: number;
  bonus: number;
}

export interface JobPartCrewAdditionalDetail {
  additionalFees?: number;
  buddyDown?: number;
  buddyUp?: number;
  byCrewManager?: number;
  byNotification?: number;
  crewSkillsText?: string;
  hours?: number;
  inConflict?: number;
  jobId?: number;
  jobPartCrewId?: number;
  jobPartLateChange?: number;
  lateChange?: boolean;
  onHoliday?: number;
  onWarnings?: number;
}


export interface StatusIcon {
  icon: string;
  color: string;
}
