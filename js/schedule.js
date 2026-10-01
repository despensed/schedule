import { state } from './state.js';
import { STORAGE_KEYS, DAYS_SHORT, DAYS_ORDER } from './constants.js';
import { $, hasSubject } from './utils.js';

const SCHEDULE_VERSION = 2;

export function getLessonsForDay(day) {
    const override = state.tempSchedule?.days?.[day];
    if (Array.isArray(override)) return override;
    return state.schedule?.days?.[day]?.lessons || [];
}

export function getBellsForDay(day) {
    const entry = state.schedule?.days?.[day];
    if (!entry) return [];
    const bells = state.schedule?.bellSchedules?.[entry.bellSchedule];
    return Array.isArray(bells) ? bells : [];
}

export function dayHasLessons(day) {
    return getLessonsForDay(day).some(hasSubject);
}

export function getBellLabel(index, genitive) {
    const n = index + 1;
    const mod10 = n % 10;
    const mod100 = n % 100;
    const one = mod10 === 1 && mod100 !== 11;
    const few = mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20);
    let word;
    if (genitive) word = (one || few) ? 'урока' : 'уроков';
    else if (one) word = 'урок';
    else if (few) word = 'урока';
    else word = 'уроков';
    return `${n} ${word}`;
}

function getTempDays() {
    const days = state.tempSchedule?.days;
    if (!days) return [];
    return DAYS_ORDER.filter(d => Array.isArray(days[d]));
}

export function updateTempBadge() {
    const badge = $('temp-badge');
    if (!badge) return;
    const days = getTempDays();
    if (!days.length) {
        badge.hidden = true;
        return;
    }
    badge.textContent = `Временное расписание · ${days.map(d => DAYS_SHORT[d]).join(', ')}`;
    badge.hidden = false;
}

function normalizeTime(value) {
    const m = /^(\d{1,2}):(\d{1,2})$/.exec(String(value ?? '').trim());
    if (!m) return null;
    const h = +m[1];
    const min = +m[2];
    if (h > 23 || min > 59) return null;
    return {
        seconds: h * 3600 + min * 60,
        text: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    };
}

function validateSchedule(raw, source) {
    if (!raw || typeof raw !== 'object') throw new Error('ожидался объект');
    if (raw.version !== SCHEDULE_VERSION) {
        throw new Error(`версия ${JSON.stringify(raw.version)}, ожидается ${SCHEDULE_VERSION}`);
    }
    if (!raw.bellSchedules || typeof raw.bellSchedules !== 'object') {
        throw new Error('нет bellSchedules');
    }
    if (!raw.days || typeof raw.days !== 'object') throw new Error('нет days');

    for (const [name, bells] of Object.entries(raw.bellSchedules)) {
        if (!Array.isArray(bells) || !bells.length) {
            throw new Error(`bellSchedules.${name}: пустой или не список`);
        }
        let prev = -1;
        for (const [i, bell] of bells.entries()) {
            const start = normalizeTime(bell?.start);
            const end = normalizeTime(bell?.end);
            if (!start || !end) throw new Error(`bellSchedules.${name}[${i}]: неверное время`);
            if (end.seconds <= start.seconds) throw new Error(`bellSchedules.${name}[${i}]: конец раньше начала`);
            if (start.seconds < prev) throw new Error(`bellSchedules.${name}[${i}]: звонки не по порядку`);
            prev = start.seconds;
            bell.start = start.text;
            bell.end = end.text;
        }
    }

    for (const day of DAYS_ORDER) {
        const entry = raw.days[day];

        if (!entry) {
            console.warn(`${source}: нет дня «${day}» — будет пустым`);
            continue;
        }
        if (typeof entry !== 'object' || Array.isArray(entry)) {
            throw new Error(`days.${day}: ожидался объект`);
        }
        if (typeof entry.bellSchedule !== 'string' || !Array.isArray(raw.bellSchedules[entry.bellSchedule])) {
            throw new Error(`days.${day}: неизвестный bellSchedule «${entry.bellSchedule}»`);
        }
        if (!Array.isArray(entry.lessons)) {
            throw new Error(`days.${day}: lessons должен быть списком`);
        }
        const slots = raw.bellSchedules[entry.bellSchedule].length;
        if (entry.lessons.length > slots) {
            throw new Error(`days.${day}: уроков ${entry.lessons.length}, а звонков только ${slots}`);
        }
        entry.lessons = entry.lessons.map(l => (typeof l === 'string' ? l.trim() : ''));
        while (entry.lessons.length < slots) entry.lessons.push('');
    }

    const extra = Object.keys(raw.days).filter(d => !DAYS_ORDER.includes(d));
    if (extra.length) console.warn(`${source}: игнорируются неизвестные дни ${extra.join(', ')}`);
    return raw;
}

function validateTemp(raw) {
    const source = 'schedule_temp.json';
    if (!raw || typeof raw !== 'object') throw new Error('ожидался объект');
    if (raw.version !== SCHEDULE_VERSION) {
        throw new Error(`версия ${JSON.stringify(raw.version)}, ожидается ${SCHEDULE_VERSION}`);
    }
    const days = raw.days;
    if (!days || typeof days !== 'object' || Array.isArray(days)) throw new Error('нет days');

    const extra = Object.keys(days).filter(d => !DAYS_ORDER.includes(d));
    if (extra.length) console.warn(`${source}: игнорируются неизвестные дни ${extra.join(', ')}`);

    for (const day of DAYS_ORDER) {
        const lessons = days[day];
        if (lessons == null) {
            days[day] = null;
            continue;
        }
        if (!Array.isArray(lessons)) throw new Error(`days.${day}: ожидался список или null`);
        days[day] = lessons.map(l => (typeof l === 'string' ? l.trim() : ''));
        const slots = getBellsForDay(day).length;
        if (slots && days[day].length > slots) {
            throw new Error(`days.${day}: уроков ${days[day].length}, а звонков только ${slots}`);
        }
    }
    return { version: SCHEDULE_VERSION, days };
}

export async function loadSchedule() {
    const cacheKey = STORAGE_KEYS.SCHEDULE_CACHE;
    const badge = $('offline-badge');
    try {
        const r = await fetch('schedule.json', { cache: 'no-cache' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = validateSchedule(await r.json(), 'schedule.json');
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
        if (badge) badge.hidden = true;
        return data;
    } catch (e) {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                if (badge) badge.hidden = false;
                return validateSchedule(JSON.parse(cached), 'кэш');
            }
        } catch (e2) {
            console.warn('Сохранённое расписание не читается:', e2);
        }
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
        return validateTemp(await r.json());
    } catch (e) {
        console.warn(`Временное расписание отключено: ${e.message}`, e);
        return null;
    }
}
