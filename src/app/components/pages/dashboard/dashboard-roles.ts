// /** Dashboard widget visibility roles (must match backend user.roles). */
// export const DASHBOARD_ROLES = {
//   regions: 'DashboardRegions',
//   crewByHour: 'DashboardCrewByHour',
//   websiteTraffic: 'DashboardWebsiteTraffic',
//   financeOverview: 'DashboardFinanceOverview',
//   warnings: 'DashboardWarnings',
//   dataIssues: 'DashboardDataIssues',
//   importantDates: 'DashboardImportantDates',
//   timesheet: 'Accountant',
//   upcomingQuotes: 'DashboardUpcomingQuotes',
// } as const;

export const DASHBOARD_ROLES = {
  regions: 'Schedule',
  crewByHour: 'Schedule',
  websiteTraffic: 'Schedule',
  financeOverview: 'Schedule',
  warnings: 'Schedule',
  dataIssues: 'Schedule',
  importantDates: 'Schedule',
  timesheet: 'Schedule',
  upcomingQuotes: 'Schedule',
} as const;
