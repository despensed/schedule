import { createDefaultSettings } from './constants.js';

export const state = {
    schedule: null,
    tempSchedule: null,
    selectedDay: 'monday',
    currentActualDay: null,
    manualDaySelection: false,
    lastTitleStr: '',
    lastListSig: '',
    statusInterval: null,
    settings: createDefaultSettings()
};
