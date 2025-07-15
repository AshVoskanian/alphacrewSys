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
