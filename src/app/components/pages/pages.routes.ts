import { Routes } from '@angular/router';
import { SamplePage2Component } from './sample-page2/sample-page2.component';
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
            path: 'sample-page2',
            component: SamplePage2Component,
            data: {
              title: "Sample-page2",
              breadcrumb: "Sample-page2",
            }
          },
        ]
      }
]
