import { state } from './state.js';
import { DAYS_EN, STORAGE_KEYS } from './constants.js';
import { loadSettings, applySettings, initSettingsUI, saveSettings } from './settings.js';
import { particlesInit } from './background.js';
import { loadSchedule, loadTempSchedule, updateTempBadge } from './schedule.js';
import { renderSchedule } from './schedule-view.js';
import { renderStatus } from './status.js';
import { initNavigation, pickInitialDay, startStatusInterval } from './navigation.js';

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

    try {
        state.schedule = await loadSchedule();
        state.tempSchedule = await loadTempSchedule();
        updateTempBadge();

        state.currentActualDay = DAYS_EN[new Date().getDay()];
        pickInitialDay();
        initNavigation();

        renderSchedule(state.selectedDay);
        renderStatus();
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