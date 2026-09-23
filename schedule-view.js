import { state } from './state.js';
import { DAYS_EN, DAYS_RU } from './constants.js';
import { escapeHtml, hasSubject, $ } from './utils.js';
import { getBellsForDay, getLessonsForDay } from './schedule.js';
import { getSubjectIcon } from './icons.js';

function getLessonStatus(day, index, bells) {
    const now = new Date();
    const today = DAYS_EN[now.getDay()];
    if (day !== today) return 'normal';
    const bell = bells[index];
    if (!bell) return 'normal';
    const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const [sh, sm] = bell.start.split(':').map(Number);
    const [eh, em] = bell.end.split(':').map(Number);
    const startTotal = sh * 3600 + sm * 60;
    const endTotal = eh * 3600 + em * 60;
    if (sec > endTotal) return 'past';
    if (sec >= startTotal) return 'current';
    return 'normal';
}

export function renderSchedule(day) {
    if (!state.schedule) return;

    document.querySelectorAll('nav ul li a').forEach(a => {
        a.classList.remove('active', 'today');
        const isActive = a.dataset.day === day;
        const isToday = a.dataset.day === state.currentActualDay;
        if (isActive) a.classList.add('active');
        if (isToday) a.classList.add('today');
        if (isActive) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });

    const bells = getBellsForDay(day);
    const lessons = getLessonsForDay(day);

    let listHtml = '';
    lessons.forEach((subject, index) => {
        const bell = bells[index];
        if (!bell || !hasSubject(subject)) return;
        const status = getLessonStatus(day, index, bells);
        const statusClass = status === 'normal' ? '' : ` class="${status}"`;
        listHtml += `
            <li${statusClass}>
                <span class="lesson-num">${bell.lesson} урок</span>
                <span class="lesson-time">${escapeHtml(bell.start)} – ${escapeHtml(bell.end)}</span>
                <span class="lesson-subject">
                    ${getSubjectIcon(subject)}
                    <span>${escapeHtml(subject)}</span>
                </span>
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