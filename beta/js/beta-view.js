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
 * --card-from-x — сторона и амплитуда выезда с бока
 * --card-delay  — задержка, чтобы карточки въезжали каскадом
 *
 * Рандомного наклона больше нет: карточки стоят ровно, как и задумано.
 */
const entrance = new Map();

const ROLL_X_MIN = 120;
const ROLL_X_MAX = 280;

function entranceVars(index) {
    let v = entrance.get(index);
    if (v) return v;

    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (ROLL_X_MIN + Math.random() * (ROLL_X_MAX - ROLL_X_MIN));
    const delay = 110 + index * 70;

    v = [
        `--card-from-x:${x.toFixed(1)}px`,
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

/** Ниже этой ширины карточки превращаются в «колоду» с одной главной. */
const DECK_MQ = window.matchMedia('(max-width: 600px)');

let scroller = null;
let scrollBoundTo = null;
let scrollFrame = 0;
let deckCentered = false;

function isDeck() {
    return DECK_MQ.matches;
}

/**
 * Помечает карточку, оказавшуюся ближе всех к центру ленты.
 * Остальные в колоде остаются приглушёнными по бокам.
 *
 * Считаем по раскладке (offsetLeft/scrollLeft), а не по
 * getBoundingClientRect: во время въезда карточки ещё сдвинуты
 * трансформацией на ±280px, и главной назначалась не та.
 */
function syncActiveCard() {
    if (!scroller) return;
    const mid = scroller.scrollLeft + scroller.clientWidth / 2;

    let best = null;
    let bestDist = Infinity;
    scroller.querySelectorAll('.beta-day').forEach(card => {
        const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
        if (d < bestDist) {
            bestDist = d;
            best = card;
        }
    });

    scroller.querySelectorAll('.beta-day').forEach(card => {
        card.classList.toggle('is-current', card === best);
    });
}

function scheduleActiveSync() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        syncActiveCard();
    });
}

/**
 * Доводит карточку в центр ленты плавной прокруткой.
 * Считает по offsetLeft, а не по getBoundingClientRect: во время
 * въезда карточка ещё сдвинута трансформацией и дельту сбило бы.
 */
function centerCard(card) {
    if (!scroller) return;
    const target = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const left = Math.max(0, Math.min(target, max));
    scroller.scrollTo({
        left,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
}

/** На узком экране лента открывается на сегодняшнем дне, не на первом. */
function focusTodayCard(force) {
    if (!scroller || !isDeck()) return;
    if (deckCentered && !force) return;

    const today = scroller.querySelector('.beta-day.is-today') || scroller.querySelector('.beta-day');
    if (!today) return;

    const max = scroller.scrollWidth - scroller.clientWidth;
    const target = Math.max(0, Math.min(
        today.offsetLeft - (scroller.clientWidth - today.offsetWidth) / 2,
        max
    ));

    // Лента ещё не измеряема (например, CSS применился после первого
    // рендера) — тогда прокрутка бессмысленна, ждём следующего resize.
    if (target > 0 && max <= 0) return;

    deckCentered = true;
    scroller.scrollTo({
        left: target,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
}

/**
 * Событие scroll не всплывает, поэтому слушатель вешается прямо на
 * ленту: делегирование на контейнер его не ловило, и после свайпа
 * главная карточка не менялась.
 */
function bindScrollerScroll() {
    if (!scroller || scrollBoundTo === scroller) return;
    scrollBoundTo = scroller;
    scroller.addEventListener('scroll', scheduleActiveSync, { passive: true });
}

export function renderDayCards() {
    const app = document.getElementById('beta-app');
    if (!app) return;

    // Перерисовка пересоздаёт карточки и обнуляет scrollLeft: на
    // телефоне это каждые 15 секунд выбрасывало ленту обратно на
    // понедельник, и выбранный день «терялся».
    const keepLeft = scroller ? scroller.scrollLeft : 0;
    app.innerHTML = shellHtml();
    scroller = document.getElementById('beta-grid');
    bindScrollerScroll();
    if (keepLeft > 0) scroller.scrollLeft = keepLeft;

    // Первый показ открывает ленту на сегодняшнем дне; перерисовка
    // пользователя назад не утаскивает.
    focusTodayCard(false);
    syncActiveCard();
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

        // В колоде тап по боковой карточке выбирает её, а не раскрывает.
        if (isDeck() && !card.classList.contains('is-current')) {
            centerCard(card);
            return;
        }

        const day = card.dataset.day;
        const open = card.classList.toggle('is-open');
        if (open) collapsed.delete(day);
        else collapsed.add(day);
        head.setAttribute('aria-expanded', String(open));
    });

    // Слушатель прокрутки вешается в bindScrollerScroll(): событие
    // scroll не всплывает до контейнера.

    const onDeckChange = () => {
        if (isDeck()) focusTodayCard(true);
        syncActiveCard();
    };
    if (DECK_MQ.addEventListener) DECK_MQ.addEventListener('change', onDeckChange);
    else if (DECK_MQ.addListener) DECK_MQ.addListener(onDeckChange);

    // Поворот экрана и поздно подключённые стили: переоцениваем ленту.
    window.addEventListener('resize', () => {
        focusTodayCard(false);
        syncActiveCard();
    });
}