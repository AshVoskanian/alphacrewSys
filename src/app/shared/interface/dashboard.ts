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

