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
  {
    path: 'crew',
    data: {
      title: "Crew"
    },
    loadComponent: () => import('../../components/pages/crew/crew.component').then(r => r.CrewComponent)
  },
  {
    path: 'crew/:id',
    data: { title: 'Crew Details' },
    loadComponent: () => import('../../components/pages/crew/crew-details/crew-details.component').then(c => c.CrewDetailsComponent)
  },
  {
    path: 'venue',
    data: {
      title: "Venue"
    },
    loadComponent: () => import('../../components/pages/venue/venue.component').then(r => r.VenueComponent)
  },
  {
    path: 'venue/:id',
    data: { title: 'Venue Details' },
    loadComponent: () => import('../../components/pages/venue/venue-details/venue-details.component').then(c => c.VenueDetailsComponent)
  },
  {
    path: 'clients',
    data: {
      title: "Clients"
    },
    loadComponent: () => import('../../components/pages/clients/clients.component').then(r => r.ClientsComponent)
  },
  {
    path: 'clients/:id',
    data: { title: 'Clients Details' },
    loadComponent: () => import('../../components/pages/clients/clients-details/clients-details.component').then(c => c.ClientsDetailsComponent)
  },
  {
    path: 'jobs',
    data: {
      title: "Jobs"
    },
    loadComponent: () => import('../../components/pages/jobs/jobs.component').then(r => r.JobsComponent)
  },
  {
    path: 'jobs/:id',
    data: { title: 'Jobs Details' },
    loadComponent: () => import('../../components/pages/jobs/jobs-details/jobs-details.component').then(c => c.JobsDetailsComponent)
  }
];
