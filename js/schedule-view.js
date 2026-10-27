import { getNote } from './notes.js';
import { dateForDay } from './overrides.js';
import { state } from './state.js';
import { DAYS_EN, DAYS_RU } from './constants.js';
import { escapeHtml, hasSubject, schoolNow, $ } from './utils.js';
import { getBellsForDay, getLessonsForDay } from './schedule.js';
import { getSubjectIcon } from './icons.js';

function getLessonStatus(day, bell) {
    const now = schoolNow();
    if (day !== DAYS_EN[now.getDay()]) return 'normal';
    const [sh, sm] = bell.start.split(':').map(Number);
    const [eh, em] = bell.end.split(':').map(Number);
    const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    if (sec > eh * 3600 + em * 60) return 'past';
    if (sec >= sh * 3600 + sm * 60) return 'current';
    return 'normal';
}

/** Подпись состояния списка: меняется, только когда меняется подсветка уроков. */
export function listSignature(day) {
    const statuses = getBellsForDay(day).map(b => getLessonStatus(day, b));
    return `${state.currentActualDay}|${day}|${statuses.join(',')}`;
}

export function renderSchedule(day) {
    document.querySelectorAll('nav ul li a').forEach(a => {
        a.classList.remove('active', 'today');
        const isActive = a.dataset.day === day;
        const isToday = a.dataset.day === state.currentActualDay;
        if (isActive) a.classList.add('active');
        if (isToday) a.classList.add('today');
        if (isActive) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });

    if (!state.schedule) return;

    const bells = getBellsForDay(day);
    const lessons = getLessonsForDay(day);

    let listHtml = '';
    lessons.forEach((subject, index) => {
        const bell = bells[index];
        if (!bell || !hasSubject(subject)) return;
        const status = getLessonStatus(day, bell);
        const date = dateForDay(day);
        const note = getNote(date, index);
        const statusClass = status === 'normal' ? '' : ` class="${status}"`;
        listHtml += `
            <li${statusClass} data-i="${index}" data-date="${date}">
                <span class="lesson-num">${index + 1}</span>
                <span class="lesson-time">${escapeHtml(bell.start)} – ${escapeHtml(bell.end)}</span>
                <span class="lesson-subject">
                    ${getSubjectIcon(subject)}
                    <span>${escapeHtml(subject)}</span>
                </span>
                <button class="note-btn" type="button" aria-label="Заметка к уроку">✎</button>
                ${note ? `<p class="lesson-note">${escapeHtml(note)}</p>` : ''}
            </li>`;
    });

    let html = `<h2>${escapeHtml(DAYS_RU[day] || '')}</h2>`;
    if (listHtml) html += `<ul class="schedule-list">${listHtml}</ul>`;
    else html += '<p class="status-text-only">В этот день уроков нет.</p>';

    let container = $('schedule-view');
    if (!container) {
        container = document.createElement('section');
        container.id = 'schedule-view';
        const main = document.querySelector('main');
        if (!main) return;
        main.appendChild(container);
    }
    container.innerHTML = html;
}
