export enum CrewAction {
  SEND_SMS = 'SEND_SMS',
  ASSIGN = 'ASSIGN',
  NOTIFY = 'NOTIFY',
  REJECT = 'REJECT',
  MARK_AS_CREW_CHIEF = 'MARK_AS_CREW_CHIEF',
  MARK_AS_TEAM_LEADER = 'MARK_AS_TEAM_LEADER',
  CONFIRM = 'CONFIRM',
  TURN_DOWN = 'TURN_DOWN',
  REMOVE = 'REMOVE',
  MARK_AS_NO_SHOW = 'MARK_AS_NO_SHOW',
  CHANGE = 'CHANGE',
  PROFILE = 'PROFILE',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

/** Status / removal actions blocked while shift crew edits are locked (`Schedule.isCrewLocked`). */
const CREW_MENU_ACTIONS_DISABLED_WHEN_SHIFT_LOCKED = new Set<CrewAction>([
  CrewAction.ASSIGN,
  CrewAction.NOTIFY,
  CrewAction.REJECT,
  CrewAction.CONFIRM,
  CrewAction.TURN_DOWN,
  CrewAction.REMOVE,
  CrewAction.MARK_AS_NO_SHOW,
]);

export function isCrewMenuActionDisabledWhenShiftLocked(action: CrewAction): boolean {
  return CREW_MENU_ACTIONS_DISABLED_WHEN_SHIFT_LOCKED.has(action);
}
