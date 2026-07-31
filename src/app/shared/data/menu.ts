import { BehaviorSubject } from "rxjs";
import { Menu } from "../interface/menu";

export const menuItems: Menu[] = [
  {
    title: 'Dashboard',
    icon: 'fa-dashboard txt-primary',
    type: 'extTabLink',
    path: '/dashboard',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Schedule',
    icon: 'fa-clipboard txt-primary',
    type: 'extTabLink',
    path: '/schedule',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Jobs',
    icon: 'fa-bars txt-primary',
    type: 'extTabLink',
    path: '/jobs',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Clients',
    icon: 'fa-building txt-primary',
    type: 'extTabLink',
    path: '/clients',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Venues',
    icon: 'fa-map-marker txt-primary',
    type: 'extTabLink',
    path: '/venue',
    bookmark: true,
    level: 1,
  },
  {
    title: 'Crew',
    icon: 'fa-users txt-primary',
    type: 'extTabLink',
    path: '/crew',
    bookmark: true,
    level: 1,
  }
]

// Array
export const items = new BehaviorSubject<Menu[]>(menuItems);
