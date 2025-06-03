import { ScheduleSkills } from "../interface/schedule";

export const SKILLS: { [key in keyof ScheduleSkills]: string } = {
  skillDriver: 'fa-solid fa-car',
  skillForklift: 'fa-solid fa-dolly',
  skillIpaf: 'fa-solid fa-arrow-up-right-dots',
  skillIpaf3b: 'fa-solid fa-arrow-up-wide-short',
  skillSafety: 'fa-solid fa-shield-halved',
  skillConstruction: 'fa-solid fa-person-digging',
  skillCarpenter: 'fa-solid fa-hammer',
  skillLightning: 'fa-solid fa-bolt',
  skillSound: 'fa-solid fa-volume-high',
  skillVideo: 'fa-solid fa-video',
  skillTfm: 'fa-solid fa-toolbox', // Assuming TFM is technical/facility management
  skillTelehandler: 'fa-solid fa-truck-ramp-box',
  skillScissorlift: 'fa-solid fa-elevator',
  skillCherrypicker: 'fa-solid fa-arrow-up-from-ground-water',
  skillFirstAid: 'fa-solid fa-kit-medical',
  skillPasma: 'fa-solid fa-helmet-safety', // PASMA related to mobile access towers
  skillFollowspot: 'fa-solid fa-lightbulb',
  skillAudioTech: 'fa-solid fa-headphones',
  skillRoughTerrainForklift: 'fa-solid fa-tractor',
  skillHealhAndSafety: 'fa-solid fa-user-shield',
  skillWorkingAtHeight: 'fa-solid fa-person-falling',
};
