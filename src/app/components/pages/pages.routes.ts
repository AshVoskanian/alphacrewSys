import { Routes } from '@angular/router';
import { SamplePage2Component } from './dashboard/sample-page2/sample-page2.component';
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
          },
          {
            path: 'dashboard2',
            component: SamplePage2Component,
            data: {
              title: "dashboard2",
              breadcrumb: "dashboard2",
            }
          },
        ]
      }
]
