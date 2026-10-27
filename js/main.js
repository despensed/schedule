import { state } from './state.js';
import { DAYS_EN, STORAGE_KEYS } from './constants.js';
import { markEntrance, schoolNow } from './utils.js';
import { initSliders } from './slider.js';
import { initNotes } from './notes.js';
import { loadSettings, applySettings, initSettingsUI, saveSettings } from './settings.js';
import { loadSchedule, updateTempBadge } from './schedule.js';
import { fetchOverridesCsv, parseOverrides } from './overrides.js';
import { renderSchedule } from './schedule-view.js';
import { initNavigation, pickInitialDay, startStatusInterval } from './navigation.js';

/**
 * Рандомизирует сторону въезда для карточки дня.
 * Значения задаются один раз и переживают последующие перерисовки,
 * потому что лежат на самом элементе, а не в его содержимом.
 */
function prepareCardEntrance(el) {
    if (!el) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    el.style.setProperty('--card-from-x', side * (48 + Math.random() * 56) + 'px');
}

async function init() {
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

    state.currentActualDay = DAYS_EN[schoolNow().getDay()];


    pickInitialDay();
    initNavigation();

    try {
        // Таблица с заменами грузится параллельно с основным расписанием.
        const overridesCsv = fetchOverridesCsv();
        state.schedule = await loadSchedule();
        state.tempSchedule = parseOverrides(await overridesCsv);
        updateTempBadge();

        renderSchedule(state.selectedDay);
        prepareCardEntrance(document.getElementById('schedule-view'));
        markEntrance();
        initSliders();
        initNotes(() => renderSchedule(state.selectedDay));

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
