import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { ActivityLogComponent } from "./widgets/activity-log/activity-log.component";
import { BuyAccountComponent } from "./widgets/buy-account/buy-account.component";
import { DetailsComponent } from './widgets/details/details.component';
import { ManageAppointmentsComponent } from "./widgets/manage-appointments/manage-appointments.component";
import { VisitorsChartComponent } from "./widgets/visitors-chart/visitors-chart.component";
import { WelcomeCardComponent } from "./widgets/welcome-card/welcome-card.component";
import { details } from '../../../../shared/data/dashboard/default';
import { Details } from '../../../../shared/interface/dashboard/default';

@Component({
  selector: 'app-default',
  imports: [WelcomeCardComponent, DetailsComponent, VisitorsChartComponent,
            ActivityLogComponent, BuyAccountComponent, ManageAppointmentsComponent],
  templateUrl: './default.component.html',
  styleUrl: './default.component.scss',
})

export class DefaultComponent {

  public details = details;
  public groupDetails: Details[][];

  constructor(private toast: ToastrService) {
    this.groupDetails = this.groupDetail(this.details, 2);
  }

  ngOnInit() {
    this.toast.show('<i class="fa fa-bell"></i> <strong>Loading Inner Data........</strong>', '', {
     enableHtml: true,
     closeButton: true,
     progressBar: true,
     progressAnimation: 'increasing',
     timeOut: 5000,
   });
 }

  groupDetail(details: Details[], groupSize: number) {
    const result = [];
    for (let i = 0; i < details.length; i += groupSize) {
      result.push(details.slice(i, i + groupSize));
    }
    return result;
  }

}
