import { Component } from '@angular/core';
import { details } from '../../../../shared/data/dashboard/default';
import { Details } from '../../../../shared/interface/dashboard/default';
import { WebsiteTrafficComponent } from "./widgets/website-traffic/website-traffic.component";
import { SalesWeekComponent } from "./widgets/sales-week/sales-week.component";
import { FinanceOverviewComponent } from "./widgets/finance-overview/finance-overview.component";
import { SocialAnalyticsComponent } from "./widgets/social-analytics/social-analytics.component";
import { RecentOrdersComponent } from "./widgets/recent-orders/recent-orders.component";

@Component({
  selector: 'app-default',
  imports: [ WebsiteTrafficComponent, SalesWeekComponent, FinanceOverviewComponent, SocialAnalyticsComponent, RecentOrdersComponent ],
  templateUrl: './default.component.html',
  styleUrl: './default.component.scss',
})

export class DefaultComponent {

  public details = details;
  public groupDetails: Details[][];

  public activeTab: string = 'youtube';


  constructor() {
    this.groupDetails = this.groupDetail(this.details, 2);
  }

  ngOnInit() {
   //  this.toast.show('<i class="fa fa-bell"></i> <strong>Loading Inner Data........</strong>', '', {
   //   enableHtml: true,
   //   closeButton: true,
   //   progressBar: true,
   //   progressAnimation: 'increasing',
   //   timeOut: 5000,
   // });
 }

  groupDetail(details: Details[], groupSize: number) {
    const result = [];
    for (let i = 0; i < details.length; i += groupSize) {
      result.push(details.slice(i, i + groupSize));
    }
    return result;
  }

  handleTab(value: string) {
    this.activeTab = value;
  }
}
