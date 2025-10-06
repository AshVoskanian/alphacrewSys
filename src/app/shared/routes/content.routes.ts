import { Routes } from '@angular/router';

export const content: Routes = [
  {
    path: '',
    data: {
      title: "Dashboard",
      breadcrumb: "dashboard",
    },
    loadChildren: () => import('../../components/pages/pages.routes').then(r => r.pages)
  },
  {
    path: 'schedule',
    data: {
      title: "Schedule",
      breadcrumb: "schedule",
    },
    loadComponent: () => import('../../components/pages/schedule/schedule.component').then(r => r.ScheduleComponent)
  },
  {
    path: 'profile',
    data: {
      title: "Profile"
    },
    loadComponent: () => import('../../components/pages/user-profile/user-profile.component').then(r => r.UserProfileComponent)
  },
];
