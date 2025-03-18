import { Routes } from '@angular/router';

export const landingRouts: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/auth',
    pathMatch: 'full'
  },
  {
    path: 'dashboard/auth',
    loadComponent: () => import('../landing/login/login.component').then(c => c.LoginComponent)
  },
];
