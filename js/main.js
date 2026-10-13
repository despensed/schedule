import { state } from './state.js';
import { DAYS_EN, STORAGE_KEYS } from './constants.js';
import { markEntrance } from './utils.js';
import { loadSettings, applySettings, initSettingsUI, saveSettings } from './settings.js';
import { particlesInit } from './background.js';
import { loadSchedule, loadTempSchedule, updateTempBadge } from './schedule.js';
import { renderSchedule } from './schedule-view.js';
import { initNavigation, pickInitialDay, startStatusInterval } from './navigation.js';

/**
 * Рандомизирует сторону и наклон въезда для карточки дня.
 * Значения задаются один раз и переживают последующие перерисовки,
 * потому что лежат на самом элементе, а не в его содержимом.
 */
function prepareCardEntrance(el) {
    if (!el) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    el.style.setProperty('--card-from-x', side * (42 + Math.random() * 44) + 'px');
    el.style.setProperty('--card-rot', ((Math.random() * 2 - 1) * 4).toFixed(2) + 'deg');
}

async function init() {
    particlesInit();
    loadSettings();
    applySettings();
    initSettingsUI();

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (mql.addEventListener) {
        mql.addEventListener('change', e => {
            if (localStorage.getItem(STORAGE_KEYS.THEME_EXPLICIT) === '1') return;
            if (state.settings.theme === 'custom') return;
            state.settings.theme = e.matches ? 'dark' : 'light';
            applySettings();
            saveSettings();
        });
    }

    state.currentActualDay = DAYS_EN[new Date().getDay()];

    if (state.settings.uiVariant === 'beta') {
        const { initBetaUI } = await import('../beta/js/beta-main.js');
        await initBetaUI();
        return;
    }

    pickInitialDay();
    initNavigation();

    try {
        state.schedule = await loadSchedule();
        state.tempSchedule = await loadTempSchedule();
        updateTempBadge();

        renderSchedule(state.selectedDay);
        prepareCardEntrance(document.getElementById('schedule-view'));
        markEntrance();

        startStatusInterval();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        const home = document.querySelector('#home');
        if (home) {
            home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Ошибка загрузки данных.</p>';
        }
    }
}

init();
