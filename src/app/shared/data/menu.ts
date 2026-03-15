import { BehaviorSubject } from "rxjs";
import { Menu } from "../interface/menu";

export const menuItems: Menu[] = [
  {
    title: 'Dashboard',
    icon: 'fa-dashboard txt-primary',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Dashboard/',
    path: '/dashboard',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Schedule',
    icon: 'fa-clipboard txt-primary',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Schedule/',
    path: '/schedule',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Jobs',
    icon: 'fa-bars txt-primary',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Jobs',
    path: '/jobs',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Clients',
    icon: 'fa-building txt-primary',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Clients',
    path: '/clients',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Venues',
    icon: 'fa-map-marker txt-primary',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Venues',
    path: '/venue',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Crew',
    icon: 'fa-users txt-primary',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Crew',
    path: '/crew',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Profile',
    icon: 'fa-user txt-primary',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/profile',
    path: '/profile',
    bookmark: true,
    level: 1,
  },
]

// Array
export const items = new BehaviorSubject<Menu[]>(menuItems);
