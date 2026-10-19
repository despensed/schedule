import { state } from './state.js';
import { DAYS_EN, DAYS_ORDER } from './constants.js';
import { getSchoolDay, schoolNow } from './utils.js';
import { renderStatus } from './status.js';
import { renderSchedule, listSignature } from './schedule-view.js';
import { updateTempBadge } from './schedule.js';

function writeHash(day) {
    const target = `#${day}`;
    if (location.hash === target) return;
    try {
        history.replaceState(null, '', target);
    } catch (e) {
        location.hash = day;
    }
}

function readHashDay() {
    const h = location.hash.slice(1);
    return DAYS_ORDER.includes(h) ? h : null;
}

function selectDay(day, manual) {
    if (!DAYS_ORDER.includes(day)) return;
    state.selectedDay = day;
    state.manualDaySelection = (manual !== false) && (day !== getSchoolDay(state.currentActualDay));
    writeHash(day);
    renderSchedule(day);

    if (state.schedule) state.lastListSig = listSignature(day);
    renderStatus();
}

function tick() {
    const now = schoolNow();
    const today = DAYS_EN[now.getDay()];

    if (state.currentActualDay !== today) {
        state.currentActualDay = today;
        updateTempBadge();
        renderToday();
        if (!state.manualDaySelection) {
            state.selectedDay = getSchoolDay(today);
            writeHash(state.selectedDay);
        }
    }

    if (state.schedule && !document.hidden) {

        const sig = listSignature(state.selectedDay);
        if (sig !== state.lastListSig) {
            state.lastListSig = sig;
            renderSchedule(state.selectedDay);
        }
        renderStatus();
    }
}

export function startStatusInterval() {
    if (state.statusInterval) return;
    state.statusInterval = setInterval(tick, 1000);
    tick();
}

function initSwipe() {
    let startX = 0;
    let startY = 0;
    let moved = false;

    document.addEventListener('touchstart', e => {

        if (document.documentElement.classList.contains('settings-open')) return;
        if (e.target.closest('.confirm-overlay')) return;
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (moved || e.touches.length !== 1) return;
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 10 || dy > 10) moved = true;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        if (!moved || e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const idx = DAYS_ORDER.indexOf(state.selectedDay);
        if (idx < 0) return;
        const nextIdx = dx < 0 ? idx + 1 : idx - 1;
        if (nextIdx < 0 || nextIdx >= DAYS_ORDER.length) return;
        selectDay(DAYS_ORDER[nextIdx], true);
    }, { passive: true });
}

function isModalOpen() {
    if (document.documentElement.classList.contains('settings-open')) return true;
    const confirm = document.getElementById('confirm-overlay');
    return !!(confirm && confirm.classList.contains('open'));
}

function initKeyboard() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (document.documentElement.classList.contains('settings-open')) {
                const closeBtn = document.getElementById('settings-close');
                if (closeBtn) closeBtn.click();
                return;
            }
        }
        if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
        if (isModalOpen()) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const page = document.getElementById('page-main');
        if (page) {
            const tag = document.activeElement && document.activeElement.tagName;
            const onControl = tag === 'BUTTON' || tag === 'A';
            const step = Math.round(page.clientHeight * 0.85);
            if (e.key === 'PageDown') {
                e.preventDefault();
                page.scrollBy(0, step);
                return;
            }
            if (e.key === 'PageUp') {
                e.preventDefault();
                page.scrollBy(0, -step);
                return;
            }
            if (e.key === 'Home' && !onControl) {
                e.preventDefault();
                page.scrollTo(0, 0);
                return;
            }
            if (e.key === 'End' && !onControl) {
                e.preventDefault();
                page.scrollTo(0, page.scrollHeight);
                return;
            }
            if (e.key === ' ' && !onControl) {
                e.preventDefault();
                page.scrollBy(0, e.shiftKey ? -step : step);
                return;
            }
        }

        if (e.key === 'ArrowLeft') {
            const idx = DAYS_ORDER.indexOf(state.selectedDay);
            if (idx > 0) selectDay(DAYS_ORDER[idx - 1], true);
        } else if (e.key === 'ArrowRight') {
            const idx = DAYS_ORDER.indexOf(state.selectedDay);
            if (idx >= 0 && idx < DAYS_ORDER.length - 1) selectDay(DAYS_ORDER[idx + 1], true);
        }
    });
}

export function renderToday() {
    const el = document.getElementById('today-date');
    if (!el) return;
    el.textContent = schoolNow().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function initNavigation() {
    renderToday();
    initSwipe();
    initKeyboard();

    window.addEventListener('hashchange', () => {
        const h = readHashDay();
        if (h && h !== state.selectedDay) selectDay(h, true);
    });

    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const day = link.dataset.day || link.getAttribute('href').substring(1);
            selectDay(day, true);
        });
    });

    const title = document.getElementById('header-title');
    if (title) {
        title.addEventListener('click', () => selectDay(getSchoolDay(state.currentActualDay), false));
    }
}

export function pickInitialDay() {
    const hashDay = readHashDay();
    const auto = getSchoolDay(state.currentActualDay);
    state.selectedDay = hashDay || auto;
    state.manualDaySelection = state.selectedDay !== auto;
}
