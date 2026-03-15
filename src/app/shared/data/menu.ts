import { BehaviorSubject } from "rxjs";
import { Menu } from "../interface/menu";

export const menuItems: Menu[] = [
  // {
  //   title: 'Dashboard',
  //   icon: 'home',
  //   type: 'link',
  //   bookmark: true,
  //   path: '/dashboard',
  //   level: 1,
  // },
  // {
  //   title: 'Schedule',
  //   icon: 'reports',
  //   type: 'link',
  //   bookmark: true,
  //   path: '/schedule',
  //   level: 1,
  // },
  // {
  //   title: 'Crew',
  //   icon: 'reports',
  //   type: 'link',
  //   bookmark: true,
  //   path: '/crew',
  //   level: 1,
  // },
  // {
  //   title: 'Profile',
  //   icon: 'reports',
  //   type: 'link',
  //   bookmark: true,
  //   path: '/profile',
  //   active: false,
  //   level: 1,
  // },
  // {
  //   main_title: 'Legacy System'
  // },
  {
    title: 'Dashboard',
    icon: 'home',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Dashboard/',
    path: '/dashboard',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Schedule',
    icon: 'reports',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Schedule/',
    path: '/schedule',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Jobs',
    icon: 'reports',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Jobs',
    path: '/jobs',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Clients',
    icon: 'reports',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Clients',
    path: '/clients',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Venues',
    icon: 'reports',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Venues',
    path: '/venue',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Crew',
    icon: 'reports',
    type: 'extTabLink',
    legacyPath: 'https://alphacrew.eu/Crew',
    path: '/crew',
    bookmark: true,
    level: 1,
  },
]

// Array
export const items = new BehaviorSubject<Menu[]>(menuItems);
