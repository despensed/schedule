import { state } from './state.js';
import { DEFAULT_SETTINGS, VALID, STORAGE_KEYS } from './constants.js';
import {
    $, isHexColor, sanitizeHex, pickValid, pickTextColor, clamp, trapFocus
} from './utils.js';
import {
    applyBackground, applyCustomSurfaceVars, clearCustomSurfaceVars
} from './background.js';
import { renderStatus } from './status.js';
import { renderSchedule } from './schedule-view.js';

const GLOW_MIN = 0;
const GLOW_MAX = 20;
const HEART_OUTLINE_MIN = 0;
const HEART_OUTLINE_MAX = 4;

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

function renderMultiColorList(containerId, colors, removable) {
    const el = $(containerId);
    if (!el) return;
    el.innerHTML = colors.map((c, i) => {
        const safe = isHexColor(c) ? c : '#000000';
        return `
            <div class="multi-color-row" data-index="${i}">
                <input type="color" value="${safe}">
                <span class="color-value">${safe}</span>
                ${removable && colors.length > 1
                    ? '<button type="button" class="multi-color-del" data-del="1" aria-label="Удалить цвет">×</button>'
                    : ''}
            </div>`;
    }).join('');
}

function updateNotifyHint() {
    const hint = $('notify-hint');
    if (!hint) return;
    if (!('Notification' in window)) {
        hint.textContent = 'Браузер не поддерживает уведомления';
        return;
    }
    if (!state.settings.notificationsEnabled) {
        hint.textContent = '';
        return;
    }
    if (Notification.permission === 'granted') hint.textContent = 'Уведомления включены';
    else if (Notification.permission === 'denied') hint.textContent = 'Разрешение отклонено в браузере';
    else hint.textContent = 'Ожидается разрешение...';
}

function migrateGlow(value) {
    if (value === 'off') return 0;
    if (value === 'soft') return 8;
    if (value === 'strong') return 16;
    if (typeof value === 'number' && isFinite(value)) {
        return clamp(value, GLOW_MIN, GLOW_MAX);
    }
    return 0;
}

export function loadSettings() {
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}') || {};
    } catch (e) {}

    const s = { ...DEFAULT_SETTINGS, ...saved };

    const explicit = localStorage.getItem(STORAGE_KEYS.THEME_EXPLICIT) === '1';
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (explicit && VALID.theme.includes(savedTheme)) s.theme = savedTheme;
    else s.theme = prefersDark ? 'dark' : 'light';

    s.theme = pickValid(s.theme, VALID.theme, 'light');
    s.timerStyle = pickValid(s.timerStyle, VALID.timerStyle, 'ring');
    s.backgroundMode = pickValid(s.backgroundMode, VALID.backgroundMode, 'orbs');
    s.particlesShape = pickValid(s.particlesShape, VALID.particlesShape, 'dot');
    s.heartAnimation = pickValid(s.heartAnimation, VALID.heartAnimation, 'none');
    s.customBaseTheme = pickValid(s.customBaseTheme, VALID.customBaseTheme, prefersDark ? 'dark' : 'light');

    s.accentColor = sanitizeHex(s.accentColor, DEFAULT_SETTINGS.accentColor);
    s.lessonColor = sanitizeHex(s.lessonColor, DEFAULT_SETTINGS.lessonColor);
    s.breakColor = sanitizeHex(s.breakColor, DEFAULT_SETTINGS.breakColor);
    s.customThemeColor = sanitizeHex(s.customThemeColor, DEFAULT_SETTINGS.customThemeColor);
    s.gradientColor1 = sanitizeHex(s.gradientColor1, DEFAULT_SETTINGS.gradientColor1);
    s.gradientColor2 = sanitizeHex(s.gradientColor2, DEFAULT_SETTINGS.gradientColor2);
    s.heartOutlineColor = sanitizeHex(s.heartOutlineColor, DEFAULT_SETTINGS.heartOutlineColor);

    s.glowIntensity = migrateGlow(s.glowIntensity);

    if (typeof s.heartOutlineWidth !== 'number' || !isFinite(s.heartOutlineWidth)) {
        s.heartOutlineWidth = DEFAULT_SETTINGS.heartOutlineWidth;
    }
    s.heartOutlineWidth = clamp(s.heartOutlineWidth, HEART_OUTLINE_MIN, HEART_OUTLINE_MAX);

    if (!Array.isArray(s.orbsColors) || s.orbsColors.length !== 3) {
        s.orbsColors = DEFAULT_SETTINGS.orbsColors.slice();
    } else {
        s.orbsColors = s.orbsColors.map((c, i) => sanitizeHex(c, DEFAULT_SETTINGS.orbsColors[i]));
    }

    if (!Array.isArray(s.particlesColors) || !s.particlesColors.length) {
        s.particlesColors = DEFAULT_SETTINGS.particlesColors.slice();
    } else {
        s.particlesColors = s.particlesColors.map(c => sanitizeHex(c, '#6366f1')).slice(0, 20);
    }

    if (typeof s.particlesCount !== 'number' || !isFinite(s.particlesCount)) s.particlesCount = 5;
    if (typeof s.particlesBlur !== 'number' || !isFinite(s.particlesBlur)) s.particlesBlur = 0;
    if (typeof s.gradientAngle !== 'number' || !isFinite(s.gradientAngle)) s.gradientAngle = 135;
    if (typeof s.notificationsEnabled !== 'boolean') s.notificationsEnabled = false;
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

export function applySettings() {
    const s = state.settings;

    if (s.theme === 'custom') {
        document.documentElement.setAttribute('data-theme', s.customBaseTheme === 'dark' ? 'dark' : 'light');
        applyCustomSurfaceVars(s.customThemeColor);
    } else {
        clearCustomSurfaceVars();
        document.documentElement.setAttribute('data-theme', s.theme);
    }

    const root = document.documentElement;
    const st = root.style;

    root.setAttribute('data-glow', s.glowIntensity > 0 ? 'on' : 'off');
    st.setProperty('--glow-blur', s.glowIntensity + 'px');
    st.setProperty('--heart-outline-width', s.heartOutlineWidth + 'px');

    st.setProperty('--accent-override', s.accentColor);
    st.setProperty('--accent-text-override', pickTextColor(s.accentColor));
    st.setProperty('--lesson-color-override', s.lessonColor);
    st.setProperty('--break-color-override', s.breakColor);
    st.setProperty('--heart-outline-override', s.heartOutlineColor);
    if (s.orbsColors[0]) st.setProperty('--orb-1', s.orbsColors[0]);
    if (s.orbsColors[1]) st.setProperty('--orb-2', s.orbsColors[1]);
    if (s.orbsColors[2]) st.setProperty('--orb-3', s.orbsColors[2]);

    setActiveSegment('theme-switch', 'themeValue', s.theme);
    setActiveSegment('style-switch', 'style', s.timerStyle);
    setActiveSegment('bg-switch', 'bg', s.backgroundMode);
    setActiveSegment('particles-shape', 'shape', s.particlesShape);
    setActiveSegment('heart-anim-switch', 'heartAnim', s.heartAnimation);
    setActiveSegment('notify-switch', 'notify', s.notificationsEnabled ? 'on' : 'off');

    setColorInput('accent-color', s.accentColor);
    setColorInput('lesson-color', s.lessonColor);
    setColorInput('break-color', s.breakColor);
    setColorInput('heart-outline-color', s.heartOutlineColor);
    setColorInput('custom-theme-color', s.customThemeColor);
    setColorInput('gradient-color1', s.gradientColor1);
    setColorInput('gradient-color2', s.gradientColor2);

    const glowSlider = $('glow-slider');
    const glowValue = $('glow-value');
    if (glowSlider) glowSlider.value = s.glowIntensity;
    if (glowValue) glowValue.textContent = s.glowIntensity;

    const howSlider = $('heart-outline-width');
    const howValue = $('heart-outline-width-value');
    if (howSlider) howSlider.value = s.heartOutlineWidth;
    if (howValue) howValue.textContent = Number(s.heartOutlineWidth).toFixed(1);

    const pc = $('particles-count');
    const pcv = $('particles-count-value');
    if (pc) pc.value = Math.min(s.particlesCount, 10);
    if (pcv) pcv.value = s.particlesCount;

    const pb = $('particles-blur');
    const pbv = $('particles-blur-value');
    if (pb) pb.value = Math.min(s.particlesBlur, 10);
    if (pbv) pbv.value = s.particlesBlur;

    const ga = $('gradient-angle');
    const gav = $('gradient-angle-value');
    if (ga) ga.value = s.gradientAngle;
    if (gav) gav.textContent = s.gradientAngle;

    toggleSubgroup('custom-theme-settings', s.theme === 'custom');
    toggleSubgroup('particles-settings', s.backgroundMode === 'particles');
    toggleSubgroup('orbs-settings', s.backgroundMode === 'orbs');
    toggleSubgroup('gradient-settings', s.backgroundMode === 'gradient');
    toggleSubgroup('heart-settings', s.timerStyle === 'hearts');

    renderMultiColorList('orbs-colors', s.orbsColors, false);
    renderMultiColorList('particles-colors', s.particlesColors, true);

    updateNotifyHint();
    applyBackground();
}

function bindMultiColorList(containerId, key, removable) {
    const el = $(containerId);
    if (!el) return;

    el.addEventListener('input', e => {
        if (!e.target.matches('input[type="color"]')) return;
        const row = e.target.closest('.multi-color-row');
        const idx = +row.dataset.index;
        const val = isHexColor(e.target.value) ? e.target.value : '#000000';
        state.settings[key][idx] = val;
        const label = row.querySelector('.color-value');
        if (label) label.textContent = val;
        applySettings();
        saveSettings();
    });

    el.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (!del || !removable) return;
        const row = e.target.closest('.multi-color-row');
        const idx = +row.dataset.index;
        if (state.settings[key].length <= 1) return;
        state.settings[key].splice(idx, 1);
        applySettings();
        saveSettings();
    });
}

export function initSettingsUI() {
    const panel = $('settings-panel');
    const overlay = $('settings-overlay');
    const menuBtn = $('menu-toggle');
    const closeBtn = $('settings-close');
    if (!panel || !overlay || !menuBtn) return;

    panel.inert = true;
    let releaseTrap = null;
    let savedFocus = null;

    const openPanel = () => {
        savedFocus = document.activeElement;
        overlay.hidden = false;
        panel.inert = false;
        panel.classList.add('open');
        overlay.classList.add('open');
        menuBtn.setAttribute('aria-expanded', 'true');
        releaseTrap = trapFocus(panel);
        if (closeBtn) closeBtn.focus();
    };

    const closePanel = () => {
        panel.classList.remove('open');
        overlay.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        if (releaseTrap) releaseTrap();
        releaseTrap = null;
        panel.inert = true;
        setTimeout(() => { overlay.hidden = true; }, 300);
        if (savedFocus && typeof savedFocus.focus === 'function') savedFocus.focus();
        savedFocus = null;
    };

    menuBtn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    const themeSwitch = $('theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('click', e => {
            const btn = e.target.closest('.seg-btn');
            if (!btn) return;
            const t = btn.dataset.themeValue;
            if (t === 'custom' && state.settings.theme !== 'custom') {
                state.settings.customBaseTheme = state.settings.theme === 'dark' ? 'dark' : 'light';
            }
            state.settings.theme = t;
            try { localStorage.setItem(STORAGE_KEYS.THEME_EXPLICIT, '1'); } catch (e2) {}
            applySettings();
            saveSettings();
        });
    }

    const notifySwitch = $('notify-switch');
    if (notifySwitch) {
        notifySwitch.addEventListener('click', async e => {
            const btn = e.target.closest('.seg-btn');
            if (!btn) return;
            if (btn.dataset.notify === 'on') {
                if (!('Notification' in window)) state.settings.notificationsEnabled = false;
                else if (Notification.permission === 'granted') state.settings.notificationsEnabled = true;
                else if (Notification.permission === 'denied') state.settings.notificationsEnabled = false;
                else {
                    try {
                        const perm = await Notification.requestPermission();
                        state.settings.notificationsEnabled = (perm === 'granted');
                    } catch (err) {
                        state.settings.notificationsEnabled = false;
                    }
                }
            } else {
                state.settings.notificationsEnabled = false;
            }
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
    bindSegment('bg-switch', 'backgroundMode', 'bg');
    bindSegment('particles-shape', 'particlesShape', 'shape');

    const glowSlider = $('glow-slider');
    if (glowSlider) {
        glowSlider.addEventListener('input', () => {
            const v = clamp(parseInt(glowSlider.value, 10) || 0, GLOW_MIN, GLOW_MAX);
            state.settings.glowIntensity = v;
            const label = $('glow-value');
            if (label) label.textContent = v;
            applySettings();
            saveSettings();
        });
    }

    const howSlider = $('heart-outline-width');
    if (howSlider) {
        howSlider.addEventListener('input', () => {
            const v = clamp(parseFloat(howSlider.value) || 0, HEART_OUTLINE_MIN, HEART_OUTLINE_MAX);
            state.settings.heartOutlineWidth = v;
            const label = $('heart-outline-width-value');
            if (label) label.textContent = v.toFixed(1);
            applySettings();
            saveSettings();
        });
    }

    ['accent', 'lesson', 'break'].forEach(name => {
        const input = $(`${name}-color`);
        if (!input) return;
        input.addEventListener('input', () => {
            if (!isHexColor(input.value)) return;
            state.settings[`${name}Color`] = input.value;
            if (name === 'lesson' && !state.settings.heartOutlineCustom) {
                state.settings.heartOutlineColor = input.value;
            }
            applySettings();
            saveSettings();
            renderStatus();
        });
    });

    const ctc = $('custom-theme-color');
    if (ctc) {
        ctc.addEventListener('input', () => {
            if (!isHexColor(ctc.value)) return;
            state.settings.customThemeColor = ctc.value;
            applySettings();
            saveSettings();
        });
    }

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

    ['gradient-color1', 'gradient-color2'].forEach(id => {
        const input = $(id);
        if (!input) return;
        const key = id === 'gradient-color1' ? 'gradientColor1' : 'gradientColor2';
        input.addEventListener('input', () => {
            if (!isHexColor(input.value)) return;
            state.settings[key] = input.value;
            applySettings();
            saveSettings();
        });
    });

    const pc = $('particles-count');
    const pcv = $('particles-count-value');
    const applyCount = v => {
        v = clamp(v | 0, 1, 100);
        state.settings.particlesCount = v;
        if (pc) pc.value = Math.min(v, 10);
        if (pcv) pcv.value = v;
        applyBackground();
        saveSettings();
    };
    if (pc) pc.addEventListener('input', () => applyCount(parseInt(pc.value, 10)));
    if (pcv) {
        pcv.addEventListener('input', () => {
            const v = parseInt(pcv.value, 10);
            if (!isNaN(v)) applyCount(v);
        });
        pcv.addEventListener('blur', () => { pcv.value = state.settings.particlesCount; });
    }

    const pb = $('particles-blur');
    const pbv = $('particles-blur-value');
    const applyBlur = v => {
        v = clamp(v | 0, 0, 100);
        state.settings.particlesBlur = v;
        if (pb) pb.value = Math.min(v, 10);
        if (pbv) pbv.value = v;
        applyBackground();
        saveSettings();
    };
    if (pb) pb.addEventListener('input', () => applyBlur(parseInt(pb.value, 10)));
    if (pbv) {
        pbv.addEventListener('input', () => {
            const v = parseInt(pbv.value, 10);
            if (!isNaN(v)) applyBlur(v);
        });
        pbv.addEventListener('blur', () => { pbv.value = state.settings.particlesBlur; });
    }

    const ga = $('gradient-angle');
    if (ga) {
        ga.addEventListener('input', () => {
            state.settings.gradientAngle = parseInt(ga.value, 10) || 0;
            const label = $('gradient-angle-value');
            if (label) label.textContent = ga.value;
            applyBackground();
            saveSettings();
        });
    }

    const addColor = $('particles-color-add');
    if (addColor) {
        addColor.addEventListener('click', () => {
            const last = state.settings.particlesColors[state.settings.particlesColors.length - 1] || '#6366f1';
            state.settings.particlesColors.push(last);
            applySettings();
            saveSettings();
        });
    }

    bindMultiColorList('orbs-colors', 'orbsColors', false);
    bindMultiColorList('particles-colors', 'particlesColors', true);

    const reset = $('reset-settings');
    if (reset) {
        reset.addEventListener('click', () => {
            state.settings = { ...DEFAULT_SETTINGS };
            try {
                localStorage.removeItem(STORAGE_KEYS.THEME_EXPLICIT);
                localStorage.removeItem(STORAGE_KEYS.THEME);
            } catch (e) {}
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.settings.theme = prefersDark ? 'dark' : 'light';
            state.settings.customBaseTheme = state.settings.theme;
            state.settings.heartOutlineColor = state.settings.lessonColor;
            applySettings();
            saveSettings();
            renderStatus();
            renderSchedule(state.selectedDay);
        });
    }
}