import { Select2Data } from "ng-select2-component";

export const ROLES: Select2Data = [
  {
    label: 'Crew',
    value: 1
  },
  {
    label: 'CrewChief',
    value: 2
  },
  {
    label: 'TeamLead',
    value: 4
  },
  {
    label: 'Skilled',
    value: 3
  }
]

export const STATUSES: Select2Data = [
  {
    label: 'Assigned',
    value: 1
  },
  {
    label: 'Unassigned',
    value: 0
  },
  {
    label: 'Confirmed',
    value: 2
  },
  {
    label: 'Reject',
    value: 3
  },
  {
    label: 'Notified',
    value: 5
  },
  {
    label: 'No Show',
    value: 6
  }
]
