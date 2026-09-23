import { DAYS_RU } from './constants.js';

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

export function trapFocus(container) {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(container.querySelectorAll(sel)).filter(n => n.offsetParent !== null);
    if (!focusables.length) return () => {};
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    function handler(e) {
        if (e.key !== 'Tab') return;
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