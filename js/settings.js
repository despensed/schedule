import { state } from './state.js';
import { DEFAULT_SETTINGS, VALID, STORAGE_KEYS } from './constants.js';
import {
    $, isHexColor, sanitizeHex, pickValid, pickTextColor, clamp, trapFocus
} from './utils.js';
import {
    applyBackground, applyCustomSurfaceVars, clearCustomSurfaceVars, particlesStart
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

    const s = { ...DEFAULT_SETTINGS, ...saved };

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

    if (s.backgroundMode === 'none') s.backgroundMode = '1color';

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
    s.gradientAngleFrom = clamp(parseInt(s.gradientAngleFrom, 10) || 30, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
    s.gradientAngleTo = clamp(parseInt(s.gradientAngleTo, 10) || 210, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
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

    delete s.notificationsEnabled;

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
    if (pc) pc.value = Math.min(s.particlesCount, 10);
    if (pcv) pcv.value = s.particlesCount;

    const pb = $('particles-blur');
    const pbv = $('particles-blur-value');
    if (pb) pb.value = Math.min(s.particlesBlur, 10);
    if (pbv) pbv.value = s.particlesBlur;

    const rot = $('gradient-rotate');
    if (rot) rot.checked = s.gradientRotate;

    const ga = $('gradient-angle');
    const gav = $('gradient-angle-value');
    if (ga) ga.value = s.gradientAngle;
    if (gav) gav.textContent = s.gradientAngle;

    const gaf = $('gradient-angle-from');
    const gafLbl = $('gradient-angle-from-value');
    if (gaf) gaf.value = s.gradientAngleFrom;
    if (gafLbl) gafLbl.textContent = s.gradientAngleFrom;

    const gat = $('gradient-angle-to');
    const gatLbl = $('gradient-angle-to-value');
    if (gat) gat.value = s.gradientAngleTo;
    if (gatLbl) gatLbl.textContent = s.gradientAngleTo;

    const gafm = $('gradient-angle-from-mobile');
    const gafmLbl = $('gradient-angle-from-mobile-value');
    if (gafm) gafm.value = s.gradientAngleFrom;
    if (gafmLbl) gafmLbl.textContent = s.gradientAngleFrom;

    const gatm = $('gradient-angle-to-mobile');
    const gatmLbl = $('gradient-angle-to-mobile-value');
    if (gatm) gatm.value = s.gradientAngleTo;
    if (gatmLbl) gatmLbl.textContent = s.gradientAngleTo;

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
    const chevron = sectionEl.querySelector('.settings-section__chevron');
    if (!header) return;
    header.addEventListener('click', () => {
        const open = sectionEl.dataset.open === 'true';
        const next = !open;
        sectionEl.dataset.open = String(next);
        header.setAttribute('aria-expanded', String(next));
        if (chevron) {
            chevron.classList.remove('is-spinning');
            void chevron.offsetWidth;
            chevron.classList.add('is-spinning');
            setTimeout(() => chevron.classList.remove('is-spinning'), 320);
        }
    });
}

function openConfirm() {
    const overlay = $('confirm-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    const cancel = $('confirm-cancel');
    if (cancel) cancel.focus();
}

function closeConfirm() {
    const overlay = $('confirm-overlay');
    if (overlay) overlay.classList.remove('open');
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

    /* ----- Тема ----- */
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

    /* ----- Таймер ----- */
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

    /* ----- Фон: орбы ----- */
    bindMultiColorList('orbs-colors', 'orbsColors', false);

    /* ----- Фон: сплошной цвет ----- */
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

    /* ----- Фон: градиент ----- */
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

    /* Двойной ползунок: desktop (overlapping) + mobile (раздельные).
       Все четыре входа пишут в state.gradientAngleFrom / To. */
    const gafD = $('gradient-angle-from');
    const gatD = $('gradient-angle-to');
    const gafM = $('gradient-angle-from-mobile');
    const gatM = $('gradient-angle-to-mobile');

    function updateAngleFrom(v) {
        v = clamp(v, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
        let to = state.settings.gradientAngleTo;
        if (v >= to) {
            to = Math.min(GRAD_ANGLE_MAX, v + 1);
            state.settings.gradientAngleTo = to;
            if (gatD) gatD.value = to;
            if (gatM) gatM.value = to;
            const lD = $('gradient-angle-to-value');
            const lM = $('gradient-angle-to-mobile-value');
            if (lD) lD.textContent = to;
            if (lM) lM.textContent = to;
        }
        state.settings.gradientAngleFrom = v;
        if (gafD) gafD.value = v;
        if (gafM) gafM.value = v;
        const lD = $('gradient-angle-from-value');
        const lM = $('gradient-angle-from-mobile-value');
        if (lD) lD.textContent = v;
        if (lM) lM.textContent = v;
        applyBackground();
        saveSettings();
    }

    function updateAngleTo(v) {
        v = clamp(v, GRAD_ANGLE_MIN, GRAD_ANGLE_MAX);
        let from = state.settings.gradientAngleFrom;
        if (v <= from) {
            from = Math.max(GRAD_ANGLE_MIN, v - 1);
            state.settings.gradientAngleFrom = from;
            if (gafD) gafD.value = from;
            if (gafM) gafM.value = from;
            const lD = $('gradient-angle-from-value');
            const lM = $('gradient-angle-from-mobile-value');
            if (lD) lD.textContent = from;
            if (lM) lM.textContent = from;
        }
        state.settings.gradientAngleTo = v;
        if (gatD) gatD.value = v;
        if (gatM) gatM.value = v;
        const lD = $('gradient-angle-to-value');
        const lM = $('gradient-angle-to-mobile-value');
        if (lD) lD.textContent = v;
        if (lM) lM.textContent = v;
        applyBackground();
        saveSettings();
    }

    if (gafD) gafD.addEventListener('input', () => updateAngleFrom(parseInt(gafD.value, 10) || 0));
    if (gafM) gafM.addEventListener('input', () => updateAngleFrom(parseInt(gafM.value, 10) || 0));
    if (gatD) gatD.addEventListener('input', () => updateAngleTo(parseInt(gatD.value, 10) || 0));
    if (gatM) gatM.addEventListener('input', () => updateAngleTo(parseInt(gatM.value, 10) || 0));

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

    /* ----- Фон: частицы ----- */
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

    /* ----- Сброс с подтверждением ----- */
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
            if (e.key === 'Escape') {
                e.preventDefault();
                closeConfirm();
            }
        });
    }

    const ok = $('confirm-ok');
    if (ok) {
        ok.addEventListener('click', () => {
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
            closeConfirm();
        });
    }
}
