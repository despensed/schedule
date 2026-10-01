import { state } from './state.js';
import { DEFAULT_SETTINGS, createDefaultSettings, VALID, STORAGE_KEYS } from './constants.js';
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
const THEME_OPACITY_MIN = 0;
const THEME_OPACITY_MAX = 100;
const GRAD_ANGLE_MIN = 0;
const GRAD_ANGLE_MAX = 360;
const GRAD_SPEED_MIN = 1;
const GRAD_SPEED_MAX = 100;

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

const COLOR_DEL_BTN = '<button type="button" class="multi-color-del" data-del="1" aria-label="Удалить цвет">×</button>';

function multiColorRowHtml() {
    return `
            <div class="multi-color-row">
                <input type="color" value="#000000">
                <span class="color-value">#000000</span>
            </div>`;
}

function renderMultiColorList(containerId, colors, removable) {
    const el = $(containerId);
    if (!el) return;

    const rows = Array.from(el.children);
    while (rows.length > colors.length) rows.pop().remove();
    while (rows.length < colors.length) {
        el.insertAdjacentHTML('beforeend', multiColorRowHtml());
        rows.push(el.lastElementChild);
    }

    const wantDel = removable && colors.length > 1;
    rows.forEach((row, i) => {
        const safe = isHexColor(colors[i]) ? colors[i] : '#000000';
        row.dataset.index = String(i);
        const input = row.querySelector('input[type="color"]');
        if (input && input.value.toLowerCase() !== safe.toLowerCase()) input.value = safe;
        const label = row.querySelector('.color-value');
        if (label && label.textContent !== safe) label.textContent = safe;
        const del = row.querySelector('.multi-color-del');
        if (wantDel && !del) row.insertAdjacentHTML('beforeend', COLOR_DEL_BTN);
        else if (!wantDel && del) del.remove();
    });
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

    const s = { ...createDefaultSettings(), ...saved };

    const explicit = localStorage.getItem(STORAGE_KEYS.THEME_EXPLICIT) === '1';
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (explicit && VALID.theme.includes(savedTheme)) s.theme = savedTheme;
    else s.theme = prefersDark ? 'dark' : 'light';

    s.theme = pickValid(s.theme, VALID.theme, 'light');
    s.timerStyle = pickValid(s.timerStyle, VALID.timerStyle, 'bar');
    s.backgroundMode = pickValid(s.backgroundMode, VALID.backgroundMode, 'orbs');
    s.particlesShape = pickValid(s.particlesShape, VALID.particlesShape, 'dot');
    s.heartAnimation = pickValid(s.heartAnimation, VALID.heartAnimation, 'none');
    s.customBaseTheme = pickValid(s.customBaseTheme, VALID.customBaseTheme, prefersDark ? 'dark' : 'light');

    s.accentColor = sanitizeHex(s.accentColor, DEFAULT_SETTINGS.accentColor);
    s.lessonColor = sanitizeHex(s.lessonColor, DEFAULT_SETTINGS.lessonColor);
    s.breakColor = sanitizeHex(s.breakColor, DEFAULT_SETTINGS.breakColor);
    s.customThemeColor = sanitizeHex(s.customThemeColor, DEFAULT_SETTINGS.customThemeColor);
    s.solidColor = sanitizeHex(s.solidColor, DEFAULT_SETTINGS.solidColor);
    s.gradientColor1 = sanitizeHex(s.gradientColor1, DEFAULT_SETTINGS.gradientColor1);
    s.gradientColor2 = sanitizeHex(s.gradientColor2, DEFAULT_SETTINGS.gradientColor2);
    s.heartOutlineColor = sanitizeHex(s.heartOutlineColor, DEFAULT_SETTINGS.heartOutlineColor);

    s.glowIntensity = migrateGlow(s.glowIntensity);

    if (typeof s.customThemeOpacity !== 'number' || !isFinite(s.customThemeOpacity)) {
        s.customThemeOpacity = DEFAULT_SETTINGS.customThemeOpacity;
    }
    s.customThemeOpacity = clamp(s.customThemeOpacity, THEME_OPACITY_MIN, THEME_OPACITY_MAX);

    if (typeof s.heartOutlineWidth !== 'number' || !isFinite(s.heartOutlineWidth)) {
        s.heartOutlineWidth = DEFAULT_SETTINGS.heartOutlineWidth;
    }
    s.heartOutlineWidth = clamp(s.heartOutlineWidth, HEART_OUTLINE_MIN, HEART_OUTLINE_MAX);

    s.gradientRotate = !!s.gradientRotate;
    s.gradientAngle = clamp(parseInt(s.gradientAngle, 10) || 135, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
    [s.gradientAngleFrom, s.gradientAngleTo] = normalizeDualAngle(s.gradientAngleFrom, s.gradientAngleTo);
    s.gradientSpeed = clamp(parseInt(s.gradientSpeed, 10) || 50, GRAD_SPEED_MIN, GRAD_SPEED_MAX);

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

const DUAL_ANGLE_GAP = 1;

const DUAL_ANGLE_IDS = {
    gradientAngleFrom: {
        desktop: 'gradient-angle-from',
        mobile: 'gradient-angle-from-mobile',
        label: 'gradient-angle-from-value',
        labelMobile: 'gradient-angle-from-mobile-value'
    },
    gradientAngleTo: {
        desktop: 'gradient-angle-to',
        mobile: 'gradient-angle-to-mobile',
        label: 'gradient-angle-to-value',
        labelMobile: 'gradient-angle-to-mobile-value'
    }
};

function normalizeDualAngle(from, to) {
    from = clamp(parseInt(from, 10) || 0, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
    to = clamp(parseInt(to, 10) || 0, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
    if (from > to) { const t = from; from = to; to = t; }
    if (to - from < DUAL_ANGLE_GAP) to = Math.min(GRAD_ANGLE_MAX, from + DUAL_ANGLE_GAP);
    return [from, to];
}

function setDualAngle(key, raw) {
    const s = state.settings;
    const other = key === 'gradientAngleFrom' ? 'gradientAngleTo' : 'gradientAngleFrom';
    const wanted = clamp(parseInt(raw, 10) || 0, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
    s[key] = key === 'gradientAngleFrom'
        ? Math.min(wanted, s[other] - DUAL_ANGLE_GAP)
        : Math.max(wanted, s[other] + DUAL_ANGLE_GAP);
    s[key] = clamp(s[key], GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
    syncDualAngleInputs(key);
    applyBackground();
    saveSettings();
}

function syncDualAngleInputs(activeKey) {
    const s = state.settings;
    for (const key of Object.keys(DUAL_ANGLE_IDS)) {
        const ids = DUAL_ANGLE_IDS[key];
        for (const el of [$(ids.desktop), $(ids.mobile)]) if (el) el.value = s[key];
        for (const el of [$(ids.label), $(ids.labelMobile)]) if (el) el.textContent = s[key];
        const el = $(ids.desktop);
        if (el) el.style.zIndex = activeKey === key ? '3' : '1';
    }
}

export function applySettings() {
    const s = state.settings;

    if (s.theme === 'custom') {
        document.documentElement.setAttribute('data-theme', s.customBaseTheme === 'dark' ? 'dark' : 'light');
        applyCustomSurfaceVars(s.customThemeColor, s.customThemeOpacity);
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

    setColorInput('accent-color', s.accentColor);
    setColorInput('lesson-color', s.lessonColor);
    setColorInput('break-color', s.breakColor);
    setColorInput('heart-outline-color', s.heartOutlineColor);
    setColorInput('custom-theme-color', s.customThemeColor);
    setColorInput('solid-color', s.solidColor);
    setColorInput('gradient-color1', s.gradientColor1);
    setColorInput('gradient-color2', s.gradientColor2);

    const glowSlider = $('glow-slider');
    const glowValue = $('glow-value');
    if (glowSlider) glowSlider.value = s.glowIntensity;
    if (glowValue) glowValue.textContent = s.glowIntensity;

    const opSlider = $('custom-theme-opacity');
    const opValue = $('custom-theme-opacity-value');
    if (opSlider) opSlider.value = s.customThemeOpacity;
    if (opValue) opValue.textContent = s.customThemeOpacity;

    const howSlider = $('heart-outline-width');
    const howValue = $('heart-outline-width-value');
    if (howSlider) howSlider.value = s.heartOutlineWidth;
    if (howValue) howValue.textContent = Number(s.heartOutlineWidth).toFixed(1);

    const pc = $('particles-count');
    const pcv = $('particles-count-value');
    if (pc) pc.value = s.particlesCount;
    if (pcv) pcv.value = s.particlesCount;

    const pb = $('particles-blur');
    const pbv = $('particles-blur-value');
    if (pb) pb.value = s.particlesBlur;
    if (pbv) pbv.value = s.particlesBlur;

    const rot = $('gradient-rotate');
    if (rot) rot.checked = s.gradientRotate;

    const ga = $('gradient-angle');
    const gav = $('gradient-angle-value');
    if (ga) ga.value = s.gradientAngle;
    if (gav) gav.textContent = s.gradientAngle;

    for (const key of Object.keys(DUAL_ANGLE_IDS)) {
        const v = clamp(state.settings[key], GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
        state.settings[key] = v;
        const ids = DUAL_ANGLE_IDS[key];
        for (const el of [$(ids.desktop), $(ids.mobile)]) if (el) el.value = v;
        for (const el of [$(ids.label), $(ids.labelMobile)]) if (el) el.textContent = v;
    }
    const dualFrom = $(DUAL_ANGLE_IDS.gradientAngleFrom.desktop);
    const dualTo = $(DUAL_ANGLE_IDS.gradientAngleTo.desktop);
    if (dualFrom && dualTo) {
        const low = state.settings.gradientAngleFrom <= state.settings.gradientAngleTo;
        dualFrom.style.zIndex = low ? '3' : '1';
        dualTo.style.zIndex = low ? '1' : '3';
    }

    const gs = $('gradient-speed');
    const gsv = $('gradient-speed-value');
    if (gs) gs.value = s.gradientSpeed;
    if (gsv) gsv.textContent = s.gradientSpeed;

    toggleSubgroup('custom-theme-settings', s.theme === 'custom');
    toggleSubgroup('heart-settings', s.timerStyle === 'hearts');
    toggleSubgroup('orbs-settings', s.backgroundMode === 'orbs');
    toggleSubgroup('solid-settings', s.backgroundMode === '1color');
    toggleSubgroup('gradient-settings', s.backgroundMode === 'gradient');
    toggleSubgroup('particles-settings', s.backgroundMode === 'particles');

    const staticAngle = $('gradient-static-angle');
    const rotateSettings = $('gradient-rotate-settings');
    if (staticAngle) staticAngle.style.display = s.gradientRotate ? 'none' : '';
    if (rotateSettings) rotateSettings.style.display = s.gradientRotate ? '' : 'none';

    renderMultiColorList('orbs-colors', s.orbsColors, false);
    renderMultiColorList('particles-colors', s.particlesColors, true);

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

    document.querySelectorAll('.settings-section').forEach(initSectionToggle);

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

    const ctc = $('custom-theme-color');
    if (ctc) {
        ctc.addEventListener('input', () => {
            if (!isHexColor(ctc.value)) return;
            state.settings.customThemeColor = ctc.value;
            applySettings();
            saveSettings();
        });
    }

    const cto = $('custom-theme-opacity');
    if (cto) {
        cto.addEventListener('input', () => {
            const v = clamp(parseInt(cto.value, 10) || 0, THEME_OPACITY_MIN, THEME_OPACITY_MAX);
            state.settings.customThemeOpacity = v;
            const label = $('custom-theme-opacity-value');
            if (label) label.textContent = v;
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

    bindMultiColorList('orbs-colors', 'orbsColors', false);

    const solidColor = $('solid-color');
    if (solidColor) {
        solidColor.addEventListener('input', () => {
            if (!isHexColor(solidColor.value)) return;
            state.settings.solidColor = solidColor.value;
            const label = $('solid-color-value');
            if (label) label.textContent = solidColor.value;
            applyBackground();
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
            applyBackground();
            saveSettings();
        });
    });

    const rotToggle = $('gradient-rotate');
    if (rotToggle) {
        rotToggle.addEventListener('change', () => {
            state.settings.gradientRotate = rotToggle.checked;
            applySettings();
            saveSettings();
        });
    }

    const gradAngle = $('gradient-angle');
    if (gradAngle) {
        gradAngle.addEventListener('input', () => {
            const v = clamp(parseInt(gradAngle.value, 10) || 0, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
            state.settings.gradientAngle = v;
            const label = $('gradient-angle-value');
            if (label) label.textContent = v;
            applyBackground();
            saveSettings();
        });
    }

    for (const key of Object.keys(DUAL_ANGLE_IDS)) {
        for (const el of [$(DUAL_ANGLE_IDS[key].desktop), $(DUAL_ANGLE_IDS[key].mobile)]) {
            if (el) el.addEventListener('input', () => setDualAngle(key, el.value));
        }
    }

    const gradSpeed = $('gradient-speed');
    if (gradSpeed) {
        gradSpeed.addEventListener('input', () => {
            const v = clamp(parseInt(gradSpeed.value, 10) || 50, GRAD_SPEED_MIN, GRAD_SPEED_MAX);
            state.settings.gradientSpeed = v;
            const label = $('gradient-speed-value');
            if (label) label.textContent = v;
            applyBackground();
            saveSettings();
        });
    }

    const pc = $('particles-count');
    const pcv = $('particles-count-value');
    const applyCount = v => {
        v = clamp(v | 0, 1, 100);
        state.settings.particlesCount = v;
        if (pc) pc.value = v;
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
        if (pb) pb.value = v;
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

    const addColor = $('particles-color-add');
    if (addColor) {
        addColor.addEventListener('click', () => {
            const last = state.settings.particlesColors[state.settings.particlesColors.length - 1] || '#6366f1';
            state.settings.particlesColors.push(last);
            applySettings();
            saveSettings();
        });
    }

    bindMultiColorList('particles-colors', 'particlesColors', true);

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
            state.settings.customBaseTheme = state.settings.theme;
            state.settings.heartOutlineColor = state.settings.lessonColor;
            applySettings();
            saveSettings();
            renderStatus();
            renderSchedule(state.selectedDay);
            closeConfirm();
        });
    }
}
