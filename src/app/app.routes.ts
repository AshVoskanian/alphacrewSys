import { Routes } from '@angular/router';
import { ContentComponent } from './shared/components/layout/content/content.component';
import { content } from './shared/routes/content.routes';
import { landingRouts } from './landing/landing-routs';
import { authGuard } from './shared/guards/auth.guard';
import { nonAuthGuard } from './shared/guards/non-auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [nonAuthGuard],
    children: landingRouts,
  },
  {
    path: '',
    canActivate: [authGuard],
    component: ContentComponent,
    children: content,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
