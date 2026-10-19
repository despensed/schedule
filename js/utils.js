import { DAYS_RU, SCHOOL_TIME_ZONE } from './constants.js';

export const $ = id => document.getElementById(id);

export function hasSubject(s) {
    return typeof s === 'string' && s.trim().length > 0;
}

export function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
}

export function pad2(n) {
    return String(n).padStart(2, '0');
}

export function isHexColor(v) {
    return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
}

export function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

export function hexToRgb(hex) {
    const c = String(hex).replace('#', '');
    if (c.length !== 6 || !/^[0-9a-f]{6}$/i.test(c)) return { r: 99, g: 102, b: 241 };
    return {
        r: parseInt(c.substr(0, 2), 16),
        g: parseInt(c.substr(2, 2), 16),
        b: parseInt(c.substr(4, 2), 16)
    };
}

export function pickTextColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 160 ? '#0f172a' : '#ffffff';
}

export function sanitizeHex(value, fallback) {
    return isHexColor(value) ? value : fallback;
}

export function pickValid(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}

export function getSchoolDay(n) {
    return DAYS_RU[n] ? n : 'monday';
}

export function markEntrance() {
    const root = document.documentElement;
    if (root.dataset.animate) return;
    root.dataset.animate = '1';
    setTimeout(() => { delete root.dataset.animate; }, 1600);
}

const FOCUSABLE_SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isFocusableVisible(el) {
    if (el.offsetParent === null) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return true;
}

export function trapFocus(container) {
    function collect() {
        return Array.from(container.querySelectorAll(FOCUSABLE_SEL)).filter(isFocusableVisible);
    }

    function handler(e) {
        if (e.key !== 'Tab') return;
        const focusables = collect();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
}

let tzFormat = null;
try {
    tzFormat = new Intl.DateTimeFormat('en-GB', {
        timeZone: SCHOOL_TIME_ZONE, hourCycle: 'h23',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
} catch (e) {  }

export function schoolNow() {
    const real = new Date();
    if (!tzFormat) return real;
    const p = {};
    for (const { type, value } of tzFormat.formatToParts(real)) p[type] = +value;
    return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}
