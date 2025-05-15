import { Routes } from '@angular/router';
import { ScheduleComponent } from './schedule/schedule.component';
import { DefaultComponent } from "./dashboard/default/default.component";

export const pages: Routes = [
    {
        path: '',
        children: [
          {
            path: 'default',
            component: DefaultComponent,
            data: {
              title: "default",
              breadcrumb: "default",
            }
          }
        ]
      }
]
