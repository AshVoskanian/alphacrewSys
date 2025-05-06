import { BehaviorSubject } from "rxjs";
import { CrewSkill } from "../interface/schedule";
import { Select2Data } from "ng-select2-component";

export const SKILLS: CrewSkill[] = [
  {
    crewSkillId: 1,
    crewSkillText: "Driver",
    crewSkillAbbr: "D",
    isPublic: true,
    description: "Driver"
  },
  {
    crewSkillId: 2,
    crewSkillText: "Forklift",
    crewSkillAbbr: "FRK",
    isPublic: true,
    description: "Forklift"
  },
  {
    crewSkillId: 3,
    crewSkillText: "Ipaf",
    crewSkillAbbr: "IPAF",
    isPublic: true,
    description: "Ipaf"
  },
  {
    crewSkillId: 6,
    crewSkillText: "Carpenter",
    crewSkillAbbr: "CARP",
    isPublic: true,
    description: "Carpenter"
  },
  {
    crewSkillId: 7,
    crewSkillText: "Lighting Technician",
    crewSkillAbbr: "LT",
    isPublic: true,
    description: "Lighting Technician"
  },
  {
    crewSkillId: 8,
    crewSkillText: "Sound Technician",
    crewSkillAbbr: "ST",
    isPublic: true,
    description: "Sound Technician"
  },
  {
    crewSkillId: 9,
    crewSkillText: "Video Technician",
    crewSkillAbbr: "VT",
    isPublic: true,
    description: "Video Technician"
  },
  {
    crewSkillId: 10,
    crewSkillText: "First Aid",
    crewSkillAbbr: "FA",
    isPublic: true,
    description: "First Aid"
  },
  {
    crewSkillId: 11,
    crewSkillText: "PASMA",
    crewSkillAbbr: "PASMA",
    isPublic: true,
    description: "PASMA"
  },
  {
    crewSkillId: 12,
    crewSkillText: "Painter",
    crewSkillAbbr: "Painter",
    isPublic: true,
    description: "Painter"
  },
  {
    crewSkillId: 13,
    crewSkillText: "Follow Spot",
    crewSkillAbbr: "FS",
    isPublic: true,
    description: "Follow Spot"
  },
  {
    crewSkillId: 14,
    crewSkillText: "Show Cover",
    crewSkillAbbr: "ShCov",
    isPublic: true,
    description: "Show Cover"
  },
  {
    crewSkillId: 15,
    crewSkillText: "Telehandler",
    crewSkillAbbr: "TH",
    isPublic: true,
    description: "Telehandler"
  },
  {
    crewSkillId: 17,
    crewSkillText: "Scissor-lift",
    crewSkillAbbr: "Scz",
    isPublic: true,
    description: "Scissor-lift"
  },
  {
    crewSkillId: 18,
    crewSkillText: "Cherrypicker",
    crewSkillAbbr: "ChPk",
    isPublic: true,
    description: "Cherrypicker"
  },
  {
    crewSkillId: 19,
    crewSkillText: "Traffic Marshall",
    crewSkillAbbr: "TFM",
    isPublic: true,
    description: "Traffic Marshall"
  }
];

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


// Array
export const items = new BehaviorSubject<CrewSkill[]>(SKILLS);
