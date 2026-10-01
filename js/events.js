import { state } from './state.js';
import { DAYS_ORDER, DAYS_SHORT } from './constants.js';
import { hasSubject } from './utils.js';
import { getBellsForDay, getLessonsForDay, dayHasLessons, getBellLabel } from './schedule.js';

function toSeconds(hhmm) {
    const [sh, sm] = hhmm.split(':').map(Number);
    return sh * 3600 + sm * 60;
}

function breakEndFor(bells, i, endTotal) {
    const next = bells[i + 1];
    return next ? toSeconds(next.start) : endTotal;
}

function upcomingLesson(day, currentSeconds, dayOffset) {
    const bells = getBellsForDay(day);
    const lessons = getLessonsForDay(day);
    for (let i = 0; i < bells.length; i++) {
        if (!hasSubject(lessons[i])) continue;
        const startTotal = toSeconds(bells[i].start);
        const secondsUntil = (24 * 3600 - currentSeconds) + (dayOffset - 1) * 24 * 3600 + startTotal;
        return {
            mode: 'upcoming',
            type: 'lesson',
            remaining: secondsUntil,
            total: secondsUntil,
            elapsed: 0,
            subject: lessons[i],
            label: `${DAYS_SHORT[day]} · до начала ${getBellLabel(i, true)}`,
            day,
            index: i
        };
    }
    return null;
}

function todayEvent(bells, lessons, currentSeconds) {
    for (let i = 0; i < bells.length; i++) {
        const subject = lessons[i];
        if (!hasSubject(subject)) continue;

        const startTotal = toSeconds(bells[i].start);
        const endTotal = toSeconds(bells[i].end);
        const breakEnd = breakEndFor(bells, i, endTotal);
        const lessonLabel = getBellLabel(i, true);

        if (currentSeconds >= startTotal && currentSeconds < endTotal) {
            return {
                mode: 'active',
                type: 'lesson',
                remaining: endTotal - currentSeconds,
                total: endTotal - startTotal,
                elapsed: currentSeconds - startTotal,
                subject,
                label: `до конца ${lessonLabel}`,
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
                subject: `Перемена после ${lessonLabel}`,
                label: 'перемена',
                index: i
            };
        }
        if (currentSeconds < startTotal) {
            return {
                mode: 'upcoming',
                type: 'lesson',
                remaining: startTotal - currentSeconds,
                total: startTotal - currentSeconds,
                elapsed: 0,
                subject,
                label: `до начала ${lessonLabel}`,
                index: i
            };
        }
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
        let offset = DAYS_ORDER.indexOf(selected) - todayIdx;
        if (offset <= 0) offset += 7;
        const ev = upcomingLesson(selected, currentSeconds, offset);
        if (ev) return ev;
    }

    if (!isWeekend) {
        const ev = todayEvent(getBellsForDay(todayName), getLessonsForDay(todayName), currentSeconds);
        if (ev) return { ...ev, day: todayName };
    }

    for (let offset = 1; offset <= 7; offset++) {
        const nextIdx = (todayIdx + offset) % 7;
        if (nextIdx >= 5) continue;
        const ev = upcomingLesson(DAYS_ORDER[nextIdx], currentSeconds, offset);
        if (ev) return ev;
    }
    return null;
}
