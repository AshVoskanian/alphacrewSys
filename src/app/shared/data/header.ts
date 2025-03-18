import { Language, Notification } from "../interface/header";

export const language: Language[] = [
  {
    id: 1,
    name: 'English',
    code: 'en',
    icon: 'us',
    country_code: "US",
    active: true
  },
  {
    id: 2,
    name: 'Deutsch',
    code: 'de',
    icon: 'de'
  },
  {
    id: 3,
    name: 'Español',
    code: 'es',
    icon: 'es'
  },
  {
    id: 4,
    name: 'Français',
    code: 'fr',
    icon: 'fr'
  },
  {
    id: 5,
    name: 'Português',
    code: 'pt',
    icon: 'pt',
    country_code: "BR"
  },
  {
    id: 6,
    name: '简体中文',
    code: 'cn',
    icon: 'cn'
  },
  {
    id: 7,
    name: 'لعربية',
    code: 'ae',
    icon: 'ae',
    country_code: "ae"
  }
]

export const notification: Notification[] = [
  {
    id: 1,
    message: 'Delivery processing',
    border_color: 'primary'
  },
  {
    id: 2,
    message: 'Order Complete',
    border_color: 'success'
  },
  {
    id: 3,
    message: 'Tickets Generated',
    border_color: 'secondary'
  },
  {
    id: 4,
    message: 'Delivery Complete',
    border_color: 'warning'
  }
]

export const profile = [
  {
    id: 1,
    title: 'Account',
    icon: 'user',
    path: 'landing/auth',
  },
  {
    id: 2,
    title: 'Inbox',
    icon: 'mail',
    path: '',
  },
  {
    id: 3,
    title: 'Taskboard',
    icon: 'file-text',
    path: '',
  },
  {
    id: 4,
    title: 'Settings',
    icon: 'settings',
    path: '',
  }
]
