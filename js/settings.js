import { state } from './state.js';
import { DEFAULT_SETTINGS, createDefaultSettings, VALID, STORAGE_KEYS, PRESETS } from './constants.js';
import {
    $, isHexColor, sanitizeHex, pickValid, pickTextColor, clamp, trapFocus
} from './utils.js';
import { renderStatus } from './status.js';
import { renderSchedule } from './schedule-view.js';

const GLOW_MIN = 0;
const GLOW_MAX = 20;
const HEART_OUTLINE_MIN = 0;
const HEART_OUTLINE_MAX = 4;

function clampInt(value, fallback, lo, hi) {
    const n = parseInt(value, 10);
    return clamp(Number.isFinite(n) ? n : fallback, lo, hi);
}

function setActiveSegment(containerId, attr, value) {
    const container = $(containerId);
    if (!container) return;
    container.querySelectorAll('.seg-btn').forEach(btn => {
        const isActive = btn.dataset[attr] === value;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });
}

function setColorInput(id, value) {
    const input = $(id);
    const label = $(`${id}-value`);
    if (input) input.value = value;
    if (label) label.textContent = value;
}

function toggleSubgroup(id, visible) {
    const el = $(id);
    if (el) el.classList.toggle('visible', visible);
}

function migrateGlow(value) {
    if (value === 'off') return 0;
    if (value === 'soft') return 8;
    if (value === 'strong') return 16;
    if (typeof value === 'number' && isFinite(value)) return clamp(value, GLOW_MIN, GLOW_MAX);
    return 0;
}

export function loadSettings() {
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}') || {};
    } catch (e) {}

    // Новый дизайн: старые цвета и фоны сбрасываем один раз.
    if (saved.designVersion !== createDefaultSettings().designVersion) saved = {};
    const s = { ...createDefaultSettings(), ...saved };

    const explicit = localStorage.getItem(STORAGE_KEYS.THEME_EXPLICIT) === '1';
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (explicit && VALID.theme.includes(savedTheme)) s.theme = savedTheme;
    else s.theme = prefersDark ? 'dark' : 'light';

    s.theme = pickValid(s.theme, VALID.theme, 'light');
    s.timerStyle = pickValid(s.timerStyle, VALID.timerStyle, 'bar');
    s.preset = pickValid(s.preset, VALID.preset, 'blank');
    s.heartAnimation = pickValid(s.heartAnimation, VALID.heartAnimation, 'none');

    s.accentColor = sanitizeHex(s.accentColor, DEFAULT_SETTINGS.accentColor);
    s.lessonColor = sanitizeHex(s.lessonColor, DEFAULT_SETTINGS.lessonColor);
    s.breakColor = sanitizeHex(s.breakColor, DEFAULT_SETTINGS.breakColor);
    s.heartOutlineColor = sanitizeHex(s.heartOutlineColor, DEFAULT_SETTINGS.heartOutlineColor);

    s.glowIntensity = migrateGlow(s.glowIntensity);


    if (typeof s.heartOutlineWidth !== 'number' || !isFinite(s.heartOutlineWidth)) {
        s.heartOutlineWidth = DEFAULT_SETTINGS.heartOutlineWidth;
    }
    s.heartOutlineWidth = clamp(s.heartOutlineWidth, HEART_OUTLINE_MIN, HEART_OUTLINE_MAX);

    if (typeof s.heartOutlineCustom !== 'boolean') s.heartOutlineCustom = false;

    if (!s.heartOutlineCustom) s.heartOutlineColor = s.lessonColor;

    state.settings = s;
}

export function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
        localStorage.setItem(STORAGE_KEYS.THEME, state.settings.theme);
    } catch (e) {}
}

function renderVariants(s) {
    const box = $('variant-switch');
    const vs = PRESETS[s.preset]?.variants || [];
    const show = vs.length > 1;
    toggleSubgroup('variant-settings', show);
    if (!box || !show) return;
    const key = vs.map(v => v.label).join();
    if (box.dataset.key !== key) {
        box.querySelectorAll('.seg-btn').forEach(b => b.remove());
        box.insertAdjacentHTML('beforeend', vs.map((v, i) =>
            `<button class="seg-btn" type="button" data-variant="${i}">${v.label}</button>`).join(''));
        box.dataset.key = key;
    }
    const act = vs.findIndex(v => Object.entries(v.set).every(([k, x]) => k === 'heartOutlineColor' || String(s[k]).toLowerCase() === String(x).toLowerCase()));
    box.querySelectorAll('.seg-btn').forEach((b, i) => {
        b.classList.toggle('active', i === act);
        b.setAttribute('aria-pressed', String(i === act));
    });
}

export function applySettings() {
    const s = state.settings;

    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.setAttribute('data-preset', s.preset);

    const root = document.documentElement;
    const st = root.style;

    // Нативные полосы прокрутки, дорожки ползунков и диалог выбора
    // цвета берут схему из color-scheme: без неё они остаются
    // светлыми на тёмной теме (и наоборот).
    const effectiveTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    st.colorScheme = effectiveTheme;

    root.setAttribute('data-glow', s.glowIntensity > 0 ? 'on' : 'off');
    st.setProperty('--glow-blur', s.glowIntensity + 'px');
    st.setProperty('--heart-outline-width', s.heartOutlineWidth + 'px');

    st.setProperty('--accent-override', s.accentColor);
    st.setProperty('--accent-text-override', pickTextColor(s.accentColor));
    st.setProperty('--lesson-color-override', s.lessonColor);
    st.setProperty('--break-color-override', s.breakColor);
    st.setProperty('--heart-outline-override', s.heartOutlineColor);

    setActiveSegment('theme-switch', 'preset', s.preset);
    renderVariants(s);
    setActiveSegment('style-switch', 'style', s.timerStyle);
    setActiveSegment('heart-anim-switch', 'heartAnim', s.heartAnimation);

    setColorInput('accent-color', s.accentColor);
    setColorInput('lesson-color', s.lessonColor);
    setColorInput('break-color', s.breakColor);
    setColorInput('heart-outline-color', s.heartOutlineColor);

    const glowSlider = $('glow-slider');
    const glowValue = $('glow-value');
    if (glowSlider) glowSlider.value = s.glowIntensity;
    if (glowValue) glowValue.textContent = s.glowIntensity;


    const howSlider = $('heart-outline-width');
    const howValue = $('heart-outline-width-value');
    if (howSlider) howSlider.value = s.heartOutlineWidth;
    if (howValue) howValue.textContent = Number(s.heartOutlineWidth).toFixed(1);

    toggleSubgroup('heart-settings', s.timerStyle === 'hearts');

}

function initSectionToggle(sectionEl) {
    const header = sectionEl.querySelector('.settings-section__header');
    if (!header) return;
    header.addEventListener('click', () => {
        const open = sectionEl.dataset.open === 'true';
        const next = !open;
        sectionEl.dataset.open = String(next);
        header.setAttribute('aria-expanded', String(next));
    });
}

let confirmReturnFocus = null;
let releaseConfirmTrap = null;

function openConfirm() {
    const overlay = $('confirm-overlay');
    if (!overlay) return;
    confirmReturnFocus = document.activeElement;
    overlay.classList.add('open');
    releaseConfirmTrap = trapFocus(overlay);
    const cancel = $('confirm-cancel');
    if (cancel) cancel.focus();
}

function closeConfirm() {
    const overlay = $('confirm-overlay');
    if (overlay) overlay.classList.remove('open');
    if (releaseConfirmTrap) releaseConfirmTrap();
    releaseConfirmTrap = null;
    if (confirmReturnFocus && typeof confirmReturnFocus.focus === 'function') confirmReturnFocus.focus();
    confirmReturnFocus = null;
}

export function initSettingsUI() {
    const panel = $('settings-panel');
    const overlay = $('settings-overlay');
    const menuBtn = $('menu-toggle');
    const closeBtn = $('settings-close');
    if (!panel || !overlay || !menuBtn) return;

    // Страница настроек раскрывается из кнопки меню: запоминаем её границы.
    const setOrigin = () => {
        const r = menuBtn.getBoundingClientRect();
        panel.style.setProperty('--o-t', `${r.top}px`);
        panel.style.setProperty('--o-r', `${window.innerWidth - r.right}px`);
        panel.style.setProperty('--o-b', `${window.innerHeight - r.bottom}px`);
        panel.style.setProperty('--o-l', `${r.left}px`);
    };
    setOrigin();
    window.addEventListener('resize', () => { if (!panel.classList.contains('open')) setOrigin(); });

    panel.inert = true;
    let closedTimer = 0;
    let releaseTrap = null;
    let savedFocus = null;
    let overlayHideTimer = 0;

    const openPanel = () => {
        if (panel.classList.contains('open')) return;
        savedFocus = document.activeElement;
        clearTimeout(overlayHideTimer);
        overlayHideTimer = 0;
        overlay.hidden = false;
        panel.inert = false;
        clearTimeout(closedTimer);
        panel.classList.remove('is-closed');
        setOrigin();
        document.documentElement.dataset.settings = 'open';
        panel.classList.add('open');
        overlay.classList.add('open');
        menuBtn.setAttribute('aria-expanded', 'true');
        releaseTrap = trapFocus(panel);
        if (closeBtn) closeBtn.focus();
    };

    const closePanel = () => {
        if (!panel.classList.contains('open')) return;
        setOrigin();
        delete document.documentElement.dataset.settings;
        panel.classList.remove('open');
        // После сворачивания окончательно прячем всё содержимое.
        closedTimer = setTimeout(() => panel.classList.add('is-closed'), 600);
        overlay.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        if (releaseTrap) releaseTrap();
        releaseTrap = null;
        panel.inert = true;
        clearTimeout(overlayHideTimer);
        overlayHideTimer = setTimeout(() => {
            overlayHideTimer = 0;
            overlay.hidden = true;
        }, 300);
        const target = savedFocus && savedFocus !== document.body && typeof savedFocus.focus === 'function'
            ? savedFocus
            : menuBtn;
        target.focus();
        savedFocus = null;
    };

    menuBtn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    document.querySelectorAll('.settings-section').forEach(initSectionToggle);


    const markExplicit = () => { try { localStorage.setItem(STORAGE_KEYS.THEME_EXPLICIT, '1'); } catch (e2) {} };
    const themeSwitch = $('theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('click', e => {
            const btn = e.target.closest('.seg-btn');
            if (!btn) return;
            const st = state.settings;
            const id = btn.dataset.preset;
            const dark = st.theme === 'dark';
            {
                // Светлая/тёмная выбранная ранее переносится на новый пресет.
                const vs = PRESETS[id].variants;
                const v = vs.find(x => x.set.theme === (dark ? 'dark' : 'light')) || vs[0];
                Object.assign(st, { preset: id }, v.set);
            }
            markExplicit();
            applySettings();
            saveSettings();
        });
    }
    const variantSwitch = $('variant-switch');
    if (variantSwitch) {
        variantSwitch.addEventListener('click', e => {
            const btn = e.target.closest('.seg-btn');
            const v = btn && PRESETS[state.settings.preset]?.variants[+btn.dataset.variant];
            if (!v) return;
            Object.assign(state.settings, v.set);
            markExplicit();
            applySettings();
            saveSettings();
        });
    }

    const bindSegment = (id, key, dsKey, rerender) => {
        const el = $(id);
        if (!el) return;
        el.addEventListener('click', e => {
            const btn = e.target.closest('.seg-btn');
            if (!btn) return;
            state.settings[key] = btn.dataset[dsKey];
            applySettings();
            saveSettings();
            if (rerender) rerender();
        });
    };
    bindSegment('style-switch', 'timerStyle', 'style', renderStatus);
    bindSegment('heart-anim-switch', 'heartAnimation', 'heartAnim', renderStatus);

    const heartOutline = $('heart-outline-color');
    if (heartOutline) {
        heartOutline.addEventListener('input', () => {
            if (!isHexColor(heartOutline.value)) return;
            state.settings.heartOutlineColor = heartOutline.value;
            state.settings.heartOutlineCustom = true;
            applySettings();
            saveSettings();
        });
    }

    const heartReset = $('heart-outline-reset');
    if (heartReset) {
        heartReset.addEventListener('click', () => {
            state.settings.heartOutlineCustom = false;
            state.settings.heartOutlineColor = state.settings.lessonColor;
            applySettings();
            saveSettings();
        });
    }

    const reset = $('reset-settings');
    if (reset) reset.addEventListener('click', openConfirm);

    const cancel = $('confirm-cancel');
    if (cancel) cancel.addEventListener('click', closeConfirm);

    const overlayConfirm = $('confirm-overlay');
    if (overlayConfirm) {
        overlayConfirm.addEventListener('click', e => {
            if (e.target === overlayConfirm) closeConfirm();
        });
        overlayConfirm.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            e.preventDefault();

            e.stopPropagation();
            closeConfirm();
        });
    }

    const ok = $('confirm-ok');
    if (ok) {
        ok.addEventListener('click', () => {

            state.settings = createDefaultSettings();
            try {
                localStorage.removeItem(STORAGE_KEYS.THEME_EXPLICIT);
                localStorage.removeItem(STORAGE_KEYS.THEME);
            } catch (e) {}
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.settings.theme = prefersDark ? 'dark' : 'light';
            state.settings.heartOutlineColor = state.settings.lessonColor;
            applySettings();
            saveSettings();
            renderStatus();
            renderSchedule(state.selectedDay);
            closeConfirm();
        });
    }
}
