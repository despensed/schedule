import { DEFAULT_SETTINGS } from './constants.js';

export const state = {
    schedule: null,
    tempSchedule: null,
    selectedDay: 'monday',
    currentActualDay: null,
    manualDaySelection: false,
    lastTitleStr: '',
    tickCounter: 0,
    lastNotifiedKey: null,
    statusInterval: null,
    settings: { ...DEFAULT_SETTINGS }
};