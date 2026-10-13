/**
 * BETA-визуал: карточки всех дней недели.
 *
 * Переиспользует общие модули ядра (state, расписание, иконки, экранирование),
 * чтобы не дублировать логику данных. Основная карточка #home
 * по-прежнему рендерится ядром через renderStatus() — здесь только сетка дней.
 */

import { state } from '../../js/state.js';
import { DAYS_ORDER, DAYS_SHORT, DAYS_RU, DAYS_EN } from '../../js/constants.js';
import { escapeHtml, hasSubject } from '../../js/utils.js';
import { getBellsForDay, getLessonsForDay, getBellLabel } from '../../js/schedule.js';
import { getSubjectIcon } from '../../js/icons.js';

/** Дни, свёрнутые пользователем. По умолчанию раскрыты все. */
const collapsed = new Set();

/**
 * Стабильные на первый запуск параметры въезда.
 *
 * --card-from-x    — сторона и амплитуда выезда с бока
 * --card-from-rot  — наклон в начале выезда (раскручивается при остановке)
 * --card-rot       — наклон, который остаётся после остановки
 * --card-delay     — задержка, чтобы карточки въезжали каскадом
 */
const entrance = new Map();

const TILT_MAX = 4;
const SPIN_MAX = 13;
const ROLL_X_MIN = 120;
const ROLL_X_MAX = 260;

function entranceVars(index) {
    let v = entrance.get(index);
    if (v) return v;

    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (ROLL_X_MIN + Math.random() * (ROLL_X_MAX - ROLL_X_MIN));
    const tilt = (Math.random() * 2 - 1) * TILT_MAX;
    const spin = tilt + side * (5 + Math.random() * (SPIN_MAX - 5));
    const delay = 110 + index * 70;

    v = [
        `--card-from-x:${x.toFixed(1)}px`,
        `--card-from-rot:${spin.toFixed(2)}deg`,
        `--card-rot:${tilt.toFixed(2)}deg`,
        `--card-delay:${delay}ms`
    ].join(';');
    entrance.set(index, v);
    return v;
}

function lessonsCount(day) {
    const bells = getBellsForDay(day);
    return getLessonsForDay(day).filter((s, i) => hasSubject(s) && bells[i]).length;
}

function lessonStatusClass(day, bell) {
    if (day !== DAYS_EN[new Date().getDay()]) return '';
    const [sh, sm] = bell.start.split(':').map(Number);
    const [eh, em] = bell.end.split(':').map(Number);
    const now = new Date();
    const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    if (sec >= sh * 3600 + sm * 60 && sec < eh * 3600 + em * 60) return ' is-current';
    if (sec >= eh * 3600 + em * 60) return ' is-past';
    return '';
}

function lessonItemHtml(day, subject, index, bell) {
    return `
            <li class="beta-lesson${lessonStatusClass(day, bell)}">
                <span class="beta-lesson__num">${index + 1}</span>
                <span class="beta-lesson__time">${escapeHtml(bell.start)} – ${escapeHtml(bell.end)}</span>
                <span class="beta-lesson__subject">
                    ${getSubjectIcon(subject)}
                    <span>${escapeHtml(subject)}</span>
                </span>
            </li>`;
}

function dayCardHtml(day, index) {
    const bells = getBellsForDay(day);
    const lessons = getLessonsForDay(day);
    const isToday = day === state.currentActualDay;
    const isOpen = !collapsed.has(day);

    let listHtml = '';
    let count = 0;
    lessons.forEach((subject, index) => {
        const bell = bells[index];
        if (!bell || !hasSubject(subject)) return;
        count++;
        listHtml += lessonItemHtml(day, subject, index, bell);
    });

    const meta = count ? getBellLabel(count - 1) : 'Уроков нет';
    const body = listHtml
        ? `<ol class="beta-day__list">${listHtml}</ol>`
        : '<p class="beta-day__empty">В этот день уроков нет.</p>';

    return `
        <article class="beta-day${isOpen ? ' is-open' : ''}${isToday ? ' is-today' : ''}" data-day="${day}"
                 style="${entranceVars(index)}">
            <button class="beta-day__head" type="button" aria-expanded="${isOpen}"
                    aria-controls="beta-body-${day}">
                <span class="beta-day__badge">${escapeHtml(DAYS_SHORT[day] || '')}</span>
                <span class="beta-day__text">
                    <span class="beta-day__name">${escapeHtml(DAYS_RU[day] || '')}</span>
                    <span class="beta-day__meta">${escapeHtml(meta)}</span>
                </span>
                ${isToday ? '<span class="beta-day__tag">Сегодня</span>' : ''}
                <span class="beta-day__chevron" aria-hidden="true">▾</span>
            </button>
            <div class="beta-day__body" id="beta-body-${day}">
                <div class="beta-day__inner">${body}</div>
            </div>
        </article>`;
}

function shellHtml() {
    const total = DAYS_ORDER.reduce((sum, day) => sum + lessonsCount(day), 0);
    return `
        <h2 class="beta-section-title">
            Расписание по дням
            <span>${escapeHtml(getBellLabel(total - 1))}</span>
        </h2>
        <div class="beta-grid" id="beta-grid">
            ${DAYS_ORDER.map(dayCardHtml).join('')}
        </div>`;
}

export function renderDayCards() {
    const app = document.getElementById('beta-app');
    if (!app) return;
    app.innerHTML = shellHtml();
}

export function initDayCards() {
    const app = document.getElementById('beta-app');
    if (!app || app.dataset.bound === '1') return;
    app.dataset.bound = '1';

    app.addEventListener('click', e => {
        const head = e.target.closest('.beta-day__head');
        if (!head || !app.contains(head)) return;
        const card = head.closest('.beta-day');
        if (!card) return;
        const day = card.dataset.day;
        const open = card.classList.toggle('is-open');
        if (open) collapsed.delete(day);
        else collapsed.add(day);
        head.setAttribute('aria-expanded', String(open));
    });
}