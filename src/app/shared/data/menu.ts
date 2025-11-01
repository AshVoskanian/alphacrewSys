import { BehaviorSubject } from "rxjs";
import { Menu } from "../interface/menu";

export const menuItems: Menu[] = [
  {
    main_title: 'General'
  },
  {
    title: 'Dashboard',
    icon: 'home',
    type: 'link',
    bookmark: true,
    path: '/dashboard',
    level: 1,
  },
  {
    title: 'Schedule',
    icon: 'reports',
    type: 'link',
    bookmark: true,
    path: '/schedule',
    level: 1,
  },
  // {
  //   title: 'Crew',
  //   icon: 'reports',
  //   type: 'link',
  //   bookmark: true,
  //   path: '/crew',
  //   level: 1,
  // },
  {
    title: 'Profile',
    icon: 'reports',
    type: 'link',
    bookmark: true,
    path: '/profile',
    active: false,
    level: 1,
  },
  {
    main_title: 'Legacy System'
  },
  {
    title: 'Dashboard',
    icon: 'reports',
    type: 'extTabLink',
    path: 'https://alphacrew.eu/Dashboard/',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Schedule',
    icon: 'reports',
    type: 'extTabLink',
    path: 'https://alphacrew.eu/Schedule/',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Jobs',
    icon: 'reports',
    type: 'extTabLink',
    path: 'https://alphacrew.eu/Jobs',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Clients',
    icon: 'reports',
    type: 'extTabLink',
    path: 'https://alphacrew.eu/Clients',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Venues',
    icon: 'reports',
    type: 'extTabLink',
    path: 'https://alphacrew.eu/Venues',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Crew',
    icon: 'reports',
    type: 'extTabLink',
    path: 'https://alphacrew.eu/Crew',
    bookmark: true,
    level: 1,
  },
]

// Array
export const items = new BehaviorSubject<Menu[]>(menuItems);
