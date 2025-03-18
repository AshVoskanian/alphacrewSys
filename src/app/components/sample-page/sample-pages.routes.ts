import { Routes } from '@angular/router';
import { SamplePageComponent } from './sample-page.component';

export const samplePages: Routes = [
  {
    path: '',
    component: SamplePageComponent,
    data: {
        title: "Sample-page",
        breadcrumb: "Sample-page",
    }
  }
]
