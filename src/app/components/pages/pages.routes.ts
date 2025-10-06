import { Routes } from '@angular/router';
import { DashboardComponent } from "./dashboard/dashboard.component";

export const pages: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: {
      title: "Dashboard",
      breadcrumb: "dashboard",
    }
  }
]
