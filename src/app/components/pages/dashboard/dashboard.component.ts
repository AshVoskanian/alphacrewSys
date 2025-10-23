import { Component } from '@angular/core';
import { WebsiteTrafficComponent } from "./widgets/website-traffic/website-traffic.component";
import { SalesWeekComponent } from "./widgets/sales-week/sales-week.component";
import { FinanceOverviewComponent } from "./widgets/finance-overview/finance-overview.component";
import { SocialAnalyticsComponent } from "./widgets/social-analytics/social-analytics.component";
import { UpcomingQuotesComponent } from "./widgets/upcoming-quotes/upcoming-quotes.component";

@Component({
  selector: 'app-dashboard',
  imports: [ WebsiteTrafficComponent, SalesWeekComponent, FinanceOverviewComponent, SocialAnalyticsComponent, UpcomingQuotesComponent ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})

export class DashboardComponent {
}
