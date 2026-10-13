/**
 * BETA-визуал: точка входа.
 *
 * Загружается динамически из js/main.js только когда в настройках выбран
 * «Вид расписания → Новый». Основная карточка (#home) рендерится общим
 * renderStatus(), здесь — подключение сетки дней и собственный тик,
 * который следит за текущим днём и обновляет карточки раз в 15 секунд.
 */

import { state } from '../../js/state.js';
import { DAYS_EN } from '../../js/constants.js';
import { getSchoolDay, markEntrance } from '../../js/utils.js';
import { loadSchedule, loadTempSchedule, updateTempBadge } from '../../js/schedule.js';
import { renderStatus } from '../../js/status.js';
import { renderDayCards, initDayCards } from './beta-view.js';

const CARDS_REFRESH_TICKS = 15;

let betaInterval = null;

function syncCurrentDay() {
    const today = DAYS_EN[new Date().getDay()];
    if (state.currentActualDay === today) return false;
    state.currentActualDay = today;
    state.selectedDay = getSchoolDay(today);
    return true;
}

function tick() {
    const dayChanged = syncCurrentDay();

    if (!state.schedule || document.hidden) return;

    if (dayChanged) {
        state.tickCounter = 0;
        renderDayCards();
        return;
    }

    state.tickCounter++;
    if (state.tickCounter >= CARDS_REFRESH_TICKS) {
        state.tickCounter = 0;
        renderDayCards();
    }
    renderStatus();
}

export async function initBetaUI() {
    document.documentElement.dataset.ui = 'beta';

    // В BETA-виде навигация по дням не нужна: дни показаны карточками,
    // а #home всегда отражает текущий день.
    state.selectedDay = getSchoolDay(state.currentActualDay);
    state.manualDaySelection = false;

    // Карточки дней стоят выше карточки таймера: сначала расписание, потом статус.
    const main = document.querySelector('main');
    let app = document.getElementById('beta-app');
    if (!app) {
        app = document.createElement('div');
        app.id = 'beta-app';
    }
    if (main && app.parentNode !== main) {
        const home = document.getElementById('home');
        if (home && home.parentNode === main) main.insertBefore(app, home);
        else main.appendChild(app);
    }
    initDayCards();

    // В классике заголовок возвращает на сегодняшний день, но
    // навигация там инициализируется вместе с ней. В BETA навигации
    // нет, поэтому заголовок просто возвращает к началу расписания.
    const title = document.getElementById('header-title');
    if (title && !title.dataset.betaBound) {
        title.dataset.betaBound = '1';
        title.addEventListener('click', () => {
            const head = document.querySelector('.beta-day__head');
            if (!head) return;
            head.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start'
            });
            head.focus({ preventScroll: true });
        });
    }

    try {
        state.schedule = await loadSchedule();
        state.tempSchedule = await loadTempSchedule();
        updateTempBadge();

        renderDayCards();
        renderStatus();
        markEntrance();

        if (!betaInterval) betaInterval = setInterval(tick, 1000);
        tick();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        const home = document.getElementById('home');
        if (home) {
            home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Ошибка загрузки данных.</p>';
        }
    }
}