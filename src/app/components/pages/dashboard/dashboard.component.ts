import { Component } from '@angular/core';
import { WebsiteTrafficComponent } from "./widgets/website-traffic/website-traffic.component";
import { SalesWeekComponent } from "./widgets/sales-week/sales-week.component";
import { FinanceOverviewComponent } from "./widgets/finance-overview/finance-overview.component";
import { SocialAnalyticsComponent } from "./widgets/social-analytics/social-analytics.component";
import { UpcomingQuotesComponent } from "./widgets/upcoming-quotes/upcoming-quotes.component";
import { DashboardWarningsComponent } from "./widgets/dashboard-warnings/dashboard-warnings.component";
import { DashboardImportantDatesComponent } from "./widgets/dashboard-important-dates/dashboard-important-dates.component";

@Component({
  selector: 'app-dashboard',
  imports: [ WebsiteTrafficComponent, SalesWeekComponent, FinanceOverviewComponent, SocialAnalyticsComponent, UpcomingQuotesComponent, DashboardWarningsComponent, DashboardImportantDatesComponent ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})

export class DashboardComponent {
}
