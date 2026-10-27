import { state } from './state.js';
import { DAYS_ORDER } from './constants.js';
import { schoolNow } from './utils.js';
import { OVERRIDES_CSV_URL, OVERRIDES_TIMEOUT_MS } from './config.js';

/**
 * Замены расписания из Google Таблицы.
 *
 * Строка таблицы: дата | звонки | урок 1 | урок 2 | …
 *  - дата: 21.10.2026 или 2026-10-21;
 *  - звонки: пусто (как обычно в этот день), имя расписания звонков
 *    из schedule.json (short, long) или «выходной» — тогда уроков нет;
 *  - уроки: по ячейке на слот, пустая ячейка — урока нет.
 *
 * state.tempSchedule хранит результат как { 'YYYY-MM-DD': { bellSchedule, lessons } }.
 */

const DAY_OFF_WORDS = ['выходной', 'нет уроков'];

function pad2(n) {
    return String(n).padStart(2, '0');
}

export function toIso(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Дата ближайшего дня недели, считая от сегодня (сегодня включительно).
 * Совпадает с логикой таймера: выбранный «понедельник» в среду — это следующий.
 */
export function dateForDay(day, now = schoolNow()) {
    const idx = DAYS_ORDER.indexOf(day);
    if (idx < 0) return null;
    const todayIdx = (now.getDay() + 6) % 7;
    const offset = (idx - todayIdx + 7) % 7;
    return toIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
}

export function getOverrideForDay(day) {
    const map = state.tempSchedule;
    if (!map) return null;
    const date = dateForDay(day);
    return (date && map[date]) || null;
}

/** Замены, которые сейчас действуют на карточках дней, по порядку дат. */
export function listUpcomingOverrides() {
    return DAYS_ORDER
        .map(day => ({ day, date: dateForDay(day) }))
        .filter(x => x.date && state.tempSchedule?.[x.date])
        .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') quoted = false;
            else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else if (c !== '\r') cell += c;
    }
    row.push(cell);
    rows.push(row);
    return rows;
}

function parseDate(raw) {
    const s = String(raw).trim();
    let y, m, d;
    let match = /^(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})$/.exec(s);
    if (match) {
        d = +match[1]; m = +match[2]; y = +match[3];
        if (y < 100) y += 2000;
    } else if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) {
        y = +match[1]; m = +match[2]; d = +match[3];
    } else {
        return null;
    }
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
}

function findBellName(raw) {
    const names = Object.keys(state.schedule?.bellSchedules || {});
    return names.find(n => n.toLowerCase() === raw) || null;
}

export async function fetchOverridesCsv() {
    if (!OVERRIDES_CSV_URL) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OVERRIDES_TIMEOUT_MS);
    try {
        const r = await fetch(OVERRIDES_CSV_URL, { cache: 'no-store', signal: ctrl.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.text();
    } catch (e) {
        console.warn('Замены недоступны, показываю обычное расписание:', e);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Разбирает CSV в замены. Плохие строки пропускаются поодиночке
 * (с предупреждением в консоли), остальные продолжают работать.
 * Нужен уже загруженный state.schedule — по нему проверяются звонки.
 */
export function parseOverrides(csvText) {
    if (!csvText || !state.schedule) return null;

    const todayIso = toIso(schoolNow());
    const out = {};

    parseCsv(csvText.replace(/^\uFEFF/, '')).forEach((cells, i) => {
        if (!cells.some(c => c.trim())) return;
        const [dateRaw = '', bellRaw = '', ...rest] = cells;
        const where = `Замены, строка ${i + 1}`;

        const date = parseDate(dateRaw);
        if (!date) {
            if (i > 0) console.warn(`${where}: непонятная дата «${dateRaw.trim()}» — строка пропущена`);
            return;
        }
        const iso = toIso(date);
        if (iso < todayIso) return;

        const dayName = DAYS_ORDER[(date.getDay() + 6) % 7];
        if (!dayName) {
            console.warn(`${where}: ${iso} — выходной по календарю, строка пропущена`);
            return;
        }

        const bell = bellRaw.trim().toLowerCase();
        if (DAY_OFF_WORDS.includes(bell)) {
            out[iso] = { bellSchedule: null, lessons: [] };
            return;
        }

        let bellName = null;
        if (bell) {
            bellName = findBellName(bell);
            if (!bellName) {
                console.warn(`${where}: нет звонков «${bell}» — строка пропущена`);
                return;
            }
        }

        const lessons = rest.map(l => l.trim());
        while (lessons.length && !lessons[lessons.length - 1]) lessons.pop();
        if (!lessons.length) {
            console.warn(`${where}: нет уроков — строка пропущена (для выходного напишите «выходной»)`);
            return;
        }

        const baseBell = state.schedule.days?.[dayName]?.bellSchedule;
        const slots = (state.schedule.bellSchedules?.[bellName || baseBell] || []).length;
        if (lessons.length > slots) {
            console.warn(`${where}: уроков ${lessons.length}, а звонков только ${slots} — строка пропущена`);
            return;
        }
        while (lessons.length < slots) lessons.push('');

        out[iso] = { bellSchedule: bellName, lessons };
    });

    return Object.keys(out).length ? out : null;
}
