import { Routes } from '@angular/router';
import { ContentComponent } from './shared/components/layout/content/content.component';
import { content } from './shared/routes/content.routes';
import { landingRouts } from "./landing/landing-routs";

export const routes: Routes = [
  {
    path: '',
    children: landingRouts
  },
  {
    path: '',
    redirectTo: '/dashboard/default',
    pathMatch: 'full'
  },
  {
    path: '',
    component: ContentComponent,
    children: content,
  },
  {
    path: '**',
    redirectTo: '',
  }
];
