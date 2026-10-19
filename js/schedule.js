import { state } from './state.js';
import { DAYS_SHORT, DAYS_ORDER } from './constants.js';
import { $, hasSubject } from './utils.js';
import { getOverrideForDay, listUpcomingOverrides } from './overrides.js';

const SCHEDULE_VERSION = 2;

export function getLessonsForDay(day) {
    const override = getOverrideForDay(day);
    if (override) return override.lessons;
    return state.schedule?.days?.[day]?.lessons || [];
}

export function getBellsForDay(day) {
    const override = getOverrideForDay(day);
    const name = override?.bellSchedule || state.schedule?.days?.[day]?.bellSchedule;
    const bells = name ? state.schedule?.bellSchedules?.[name] : null;
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

export function updateTempBadge() {
    const badge = $('temp-badge');
    if (!badge) return;
    const list = listUpcomingOverrides();
    if (!list.length) {
        badge.hidden = true;
        return;
    }
    const parts = list.map(({ day, date }) => {
        const [, m, d] = date.split('-');
        return `${DAYS_SHORT[day]} ${d}.${m}`;
    });
    badge.textContent = `Замены · ${parts.join(', ')}`;
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
            throw new Error(`days.${day}: поле lessons должно быть списком`);
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

export async function loadSchedule() {
    const r = await fetch('schedule.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return validateSchedule(await r.json(), 'schedule.json');
}
