export interface SocialAnalytics {
  marker: SocialAnalyticsMarkers[],
  charts: SocialAnalyticsChartDetails[];
}

export interface SocialAnalyticsMarkers {
  title: string;
  color: string;
}
export interface SocialAnalyticsChartDetails {
  value: string;
  chart_details: any;
}

export interface UpcomingQuotes {
  id: number;
  jobId: number;
  orderedBy: string;
  editedBy: string;
  companyName: string;
  venueName: string;
  contactName: string;
  phoneNumber: string;
  postcode: string;
  startDate: string;
  total: number;
  parts: number;
}

export interface CrewByHour {
  times: string;
  weekday: number;
  hour: number;
  limit: number;
  warning: number;
  crew: number;
  status: number;
  cssColour: string;
  title: string;
}

export interface DashboardWarning {
  strikeId: number;
  isActive: number;
  warningType: number;
  text: string;
  crewId: number;
  name: string;
  jobId: number;
  jobPartId: number;
  startDate: string;
  jobPartVenueName: string;
  companyName: string;
  venueName: string;
  strikeReason: string;
  strikeDate: string;
  createBy: string;
  createDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface DashboardCrewInfo {
  crewId: number;
  name: string;
}

export interface DashboardJobInfo {
  jobPartId: number;
  startDate: string;
  startTime: string;
  crew: number;
  hours: number;
  address: string;
}

export interface StrikeModel {
  strikeId: number;
  warningType: number;
  crewId: number;
  jobId: number | null;
  jobPartId: number | null;
  strikeReason: string;
  strikeDate: string;
  createBy?: string;
  createDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

export interface DashboardImportantDate {
  jobId: number;
  orderedBy: string;
  editedBy: string;
  companyName: string;
  venueName: string;
  contactName: string;
  phoneNumber: string;
  postcode: string;
  startDate: string;
  total: number;
  parts: number;
}


