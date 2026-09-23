import { state } from './state.js';
import { STORAGE_KEYS, DAYS_RU } from './constants.js';
import { $, hasSubject } from './utils.js';

export function getActiveTempForDay(day) {
    const t = state.tempSchedule;
    if (!t || !t.active || t.day !== day) return null;
    return t;
}

export function getLessonsForDay(day) {
    const temp = getActiveTempForDay(day);
    if (temp && Array.isArray(temp.lessons)) return temp.lessons.slice();
    return (state.schedule?.days?.[day]) || [];
}

export function getBellsForDay(day) {
    const bells = state.schedule?.bells;
    if (!bells) return [];
    const temp = getActiveTempForDay(day);
    const mode = (temp && temp.bellsMode)
        || ((day === 'monday' || day === 'thursday') ? 'monday' : 'tuesday_friday');
    return mode === 'monday' ? bells.monday : bells.tuesday_friday;
}

export function dayHasLessons(day) {
    return getLessonsForDay(day).some(hasSubject);
}

export function updateTempBadge() {
    const badge = $('temp-badge');
    if (!badge) return;
    const t = state.tempSchedule;
    if (!t || !t.active || !t.day) {
        badge.hidden = true;
        return;
    }
    badge.textContent = `Временное расписание · ${DAYS_RU[t.day] || ''}`;
    badge.hidden = false;
}

export async function loadSchedule() {
    const cacheKey = STORAGE_KEYS.SCHEDULE_CACHE;
    const badge = $('offline-badge');
    try {
        const r = await fetch('schedule.json', { cache: 'no-cache' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
        if (badge) badge.hidden = true;
        return data;
    } catch (e) {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                if (badge) badge.hidden = false;
                return JSON.parse(cached);
            }
        } catch (e2) {}
        throw e;
    }
}

export async function loadTempSchedule() {
    let r;
    try {
        r = await fetch('schedule_temp.json', { cache: 'no-cache' });
    } catch (e) {
        console.warn('Временное расписание: сеть недоступна', e);
        return null;
    }
    if (r.status === 404) return null;
    if (!r.ok) {
        console.warn(`Временное расписание: HTTP ${r.status}`);
        return null;
    }
    try {
        const data = await r.json();
        if (!data || typeof data !== 'object') return null;
        if (!data.active || !data.day || !Array.isArray(data.lessons)) return null;
        return data;
    } catch (e) {
        console.warn('Временное расписание: некорректный JSON', e);
        return null;
    }
}