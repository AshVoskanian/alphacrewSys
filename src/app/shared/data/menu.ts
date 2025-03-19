import { BehaviorSubject } from "rxjs";
import { Menu } from "../interface/menu";

export const menuItems: Menu[] = [
  {
    main_title: 'General'
  },
  {
    title: 'Dashboard',
    icon: 'home',
    type: 'sub',
    active: true,
    level: 1,
    children: [
      { path: '/dashboard/default', title: 'Default', type: 'link' },
      { path: '/dashboard/dashboard2', title: 'Other dashboard data', type: 'link' },
    ],
  },
  {
    title: 'Schedule',
    icon: 'support-tickets',
    type: 'link',
    bookmark: true,
    path: '/sample-page',
    level: 1,
  },
]

// Array
export const items = new BehaviorSubject<Menu[]>(menuItems);
