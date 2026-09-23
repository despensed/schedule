import { clamp, pad2 } from './utils.js';
import { HEART_PATH } from './constants.js';

export function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}д ${h}ч`;
    if (h > 0) return `${h}ч ${pad2(m)}м`;
    if (m > 0) return `${m}м ${pad2(s)}с`;
    return `${s}с`;
}

export function formatMinutesPretty(totalMin) {
    totalMin = Math.max(0, Math.round(totalMin));
    if (totalMin < 60) return `${totalMin} мин`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

export function formatProgressDetail(event) {
    if (!event || !event.total || event.total < 60) return '';
    const totalMin = Math.max(1, Math.round(event.total / 60));
    if (event.mode === 'upcoming') return 'до начала';
    const elapsedMin = clamp(Math.floor(event.elapsed / 60), 0, totalMin);
    return `${formatMinutesPretty(elapsedMin)} из ${formatMinutesPretty(totalMin)}`;
}

export function heartsFillFraction(progress, type, mode) {
    if (mode === 'upcoming') return 10;
    return type === 'lesson' ? (1 - progress) * 10 : progress * 10;
}

export function heartSvgMarkup(value, bounce, idx) {
    const clip = `inset(0 ${(1 - value) * 100}% 0 0)`;
    return `<svg class="heart-icon${bounce ? ' bouncing' : ''}" style="--i:${idx}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="heart-outline" d="${HEART_PATH}" />
        <path class="heart-fill" style="clip-path:${clip};-webkit-clip-path:${clip};" d="${HEART_PATH}" />
    </svg>`;
}

export function buildHeartsHtml(filledFraction, bounce) {
    let html = '';
    for (let i = 0; i < 10; i++) {
        html += heartSvgMarkup(clamp(filledFraction - i, 0, 1), bounce, i);
    }
    return html;
}

export function clockDigitHtml(digit) {
    return `<span class="clock-digit"><span class="clock-digit-layer">${digit}</span></span>`;
}

export function buildClockHtml(remaining) {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    const showH = h > 0;
    const hs = pad2(h);
    const ms = pad2(m);
    const ss = pad2(s);
    return `
        <div class="status-clock ${showH ? '' : 'no-hours'}">
            <div class="clock-part-h">
                <span class="clock-segment" data-unit="h">${clockDigitHtml(hs[0])}${clockDigitHtml(hs[1])}</span>
                <span class="clock-sep">|</span>
            </div>
            <span class="clock-segment" data-unit="m">${clockDigitHtml(ms[0])}${clockDigitHtml(ms[1])}</span>
            <span class="clock-sep">|</span>
            <span class="clock-segment" data-unit="s">${clockDigitHtml(ss[0])}${clockDigitHtml(ss[1])}</span>
        </div>
    `;
}

function rollClockDigit(digitEl, newVal) {
    if (!digitEl) return;
    digitEl.querySelectorAll('.clock-digit-exit').forEach(el => el.remove());
    const layers = digitEl.querySelectorAll('.clock-digit-layer');
    const cur = layers[layers.length - 1];
    if (!cur || cur.textContent === newVal) return;
    cur.classList.add('clock-digit-exit');
    const next = document.createElement('span');
    next.className = 'clock-digit-layer clock-digit-enter';
    next.textContent = newVal;
    digitEl.appendChild(next);
    setTimeout(() => cur.remove(), 450);
}

function updateClockSegment(seg, newValue) {
    if (!seg) return;
    const str = pad2(newValue);
    const digits = seg.querySelectorAll('.clock-digit');
    if (digits.length < 2) return;
    rollClockDigit(digits[0], str[0]);
    rollClockDigit(digits[1], str[1]);
}

export function updateClockNumbers(remaining) {
    const clock = document.querySelector('.status-clock');
    if (!clock) return;
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    clock.classList.toggle('no-hours', h === 0);
    updateClockSegment(clock.querySelector('.clock-segment[data-unit="h"]'), h);
    updateClockSegment(clock.querySelector('.clock-segment[data-unit="m"]'), m);
    updateClockSegment(clock.querySelector('.clock-segment[data-unit="s"]'), s);
}