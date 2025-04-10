import { Routes } from '@angular/router';

export const landingRouts: Routes = [
  {
    path: '',
    redirectTo: 'landing/auth',
    pathMatch: 'full'
  },
  {
    path: 'landing/auth',
    loadComponent: () => import('../landing/login/login.component').then(c => c.LoginComponent)
  },
];
