import { state } from './state.js';
import { DAYS_ORDER, DAYS_SHORT } from './constants.js';
import { hasSubject } from './utils.js';
import { getBellsForDay, getLessonsForDay, dayHasLessons } from './schedule.js';

function firstLessonOfDay(day, currentSeconds, todayIdx) {
    const targetIdx = DAYS_ORDER.indexOf(day);
    if (targetIdx < 0) return null;
    let offset = targetIdx - todayIdx;
    if (offset <= 0) offset += 7;

    const bells = getBellsForDay(day);
    const lessons = getLessonsForDay(day);
    for (let i = 0; i < bells.length; i++) {
        if (!hasSubject(lessons[i])) continue;
        const bell = bells[i];
        const [sh, sm] = bell.start.split(':').map(Number);
        const startTotal = sh * 3600 + sm * 60;
        const secondsUntil = (24 * 3600 - currentSeconds) + (offset - 1) * 24 * 3600 + startTotal;
        return {
            mode: 'upcoming',
            type: 'lesson',
            remaining: secondsUntil,
            total: secondsUntil,
            elapsed: 0,
            subject: lessons[i],
            label: `${DAYS_SHORT[day]} · до начала ${bell.lesson} урока`,
            day,
            index: i
        };
    }
    return null;
}

export function getNextEvent(now, selected) {
    if (!state.schedule) return null;
    const todayIdx = (now.getDay() + 6) % 7;
    const isWeekend = todayIdx >= 5;
    const todayName = isWeekend ? null : DAYS_ORDER[todayIdx];
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    if (selected && selected !== todayName && DAYS_ORDER.includes(selected)) {
        if (!dayHasLessons(selected)) return { mode: 'empty', day: selected };
        const ev = firstLessonOfDay(selected, currentSeconds, todayIdx);
        if (ev) return ev;
    }

    if (!isWeekend) {
        const bells = getBellsForDay(todayName);
        const lessons = getLessonsForDay(todayName);
        for (let i = 0; i < bells.length; i++) {
            const bell = bells[i];
            const [sh, sm] = bell.start.split(':').map(Number);
            const [eh, em] = bell.end.split(':').map(Number);
            const startTotal = sh * 3600 + sm * 60;
            const endTotal = eh * 3600 + em * 60;
            const breakEnd = endTotal + (bell.break || 0) * 60;
            const subject = lessons[i];
            if (!hasSubject(subject)) continue;

            if (currentSeconds >= startTotal && currentSeconds < endTotal) {
                return {
                    mode: 'active',
                    type: 'lesson',
                    remaining: endTotal - currentSeconds,
                    total: endTotal - startTotal,
                    elapsed: currentSeconds - startTotal,
                    subject,
                    label: `до конца ${bell.lesson} урока`,
                    day: todayName,
                    index: i
                };
            }
            if (currentSeconds >= endTotal && currentSeconds < breakEnd) {
                return {
                    mode: 'active',
                    type: 'break',
                    remaining: breakEnd - currentSeconds,
                    total: breakEnd - endTotal,
                    elapsed: currentSeconds - endTotal,
                    subject: `Перемена после ${bell.lesson} урока`,
                    label: 'перемена',
                    day: todayName,
                    index: i
                };
            }
            if (currentSeconds < startTotal) {
                const diff = startTotal - currentSeconds;
                return {
                    mode: 'upcoming',
                    type: 'lesson',
                    remaining: diff,
                    total: diff,
                    elapsed: 0,
                    subject,
                    label: `до начала ${bell.lesson} урока`,
                    day: todayName,
                    index: i
                };
            }
        }
    }

    for (let offset = 1; offset <= 7; offset++) {
        const nextIdx = (todayIdx + offset) % 7;
        if (nextIdx >= 5) continue;
        const dayName = DAYS_ORDER[nextIdx];
        const bells = getBellsForDay(dayName);
        const lessons = getLessonsForDay(dayName);
        for (let i = 0; i < bells.length; i++) {
            const bell = bells[i];
            if (!hasSubject(lessons[i])) continue;
            const [sh, sm] = bell.start.split(':').map(Number);
            const startTotal = sh * 3600 + sm * 60;
            const secondsUntil = (24 * 3600 - currentSeconds) + (offset - 1) * 24 * 3600 + startTotal;
            return {
                mode: 'upcoming',
                type: 'lesson',
                remaining: secondsUntil,
                total: secondsUntil,
                elapsed: 0,
                subject: lessons[i],
                label: `${DAYS_SHORT[dayName]} · до начала ${bell.lesson} урока`,
                day: dayName,
                index: i
            };
        }
    }
    return null;
}

export function maybeNotify(event) {
    if (!state.settings.notificationsEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    if (!event) {
        state.lastNotifiedKey = null;
        return;
    }

    if (event.mode !== 'active' || event.type !== 'lesson') {
        if (state.lastNotifiedKey) {
            const prefix = `${event.day}|${event.index}|`;
            if (!String(state.lastNotifiedKey).startsWith(prefix)) state.lastNotifiedKey = null;
        }
        return;
    }

    const key = `${event.day}|${event.index}|${event.subject}`;
    if (key === state.lastNotifiedKey) return;
    state.lastNotifiedKey = key;
    try {
        new Notification('Урок начался', { body: event.subject, tag: 'lesson-start' });
    } catch (e) {}
}