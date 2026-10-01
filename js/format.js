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

function formatMinutesPretty(totalMin) {
    totalMin = Math.max(0, Math.round(totalMin));
    if (totalMin < 60) return `${totalMin} мин`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

export function formatProgressDetail(event) {
    if (!event || !event.total || event.total < 60) return '';
    const totalMin = Math.max(1, Math.round(event.total / 60));
    const elapsedMin = clamp(Math.floor(event.elapsed / 60), 0, totalMin);
    return `${formatMinutesPretty(elapsedMin)} из ${formatMinutesPretty(totalMin)}`;
}

export function heartsFillFraction(progress, type, mode) {
    if (mode === 'upcoming') return 10;
    return type === 'lesson' ? (1 - progress) * 10 : progress * 10;
}

function heartSvgMarkup(value, bounce, idx) {
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

function clockDigitHtml(digit) {
    return `<span class="clock-digit"><span class="clock-digit-layer">${digit}</span></span>`;
}

function clockDigitsHtml(str) {
    let html = '';
    for (const ch of String(str)) html += clockDigitHtml(ch);
    return html;
}

export function buildClockHtml(remaining) {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    return `
        <div class="status-clock${h > 0 ? '' : ' no-hours'}">
            <div class="clock-part-h">
                <span class="clock-segment" data-unit="h">${clockDigitsHtml(pad2(h))}</span>
                <span class="clock-sep">|</span>
            </div>
            <span class="clock-segment" data-unit="m">${clockDigitsHtml(pad2(m))}</span>
            <span class="clock-sep">|</span>
            <span class="clock-segment" data-unit="s">${clockDigitsHtml(pad2(s))}</span>
        </div>
    `;
}

function rollClockDigit(digitEl, newVal) {
    if (!digitEl) return;
    digitEl.querySelectorAll('.clock-digit-exit').forEach(el => el.remove());
    const layers = digitEl.querySelectorAll('.clock-digit-layer');
    const cur = layers[layers.length - 1];
    if (!cur) {

        const fresh = document.createElement('span');
        fresh.className = 'clock-digit-layer';
        fresh.textContent = newVal;
        digitEl.appendChild(fresh);
        return;
    }
    if (cur.textContent === newVal) return;
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
    const digits = Array.from(seg.querySelectorAll('.clock-digit'));
    while (digits.length > str.length) digits.pop().remove();
    while (digits.length < str.length) {
        const el = document.createElement('span');
        el.className = 'clock-digit';
        seg.appendChild(el);
        digits.push(el);
    }
    digits.forEach((el, i) => rollClockDigit(el, str[i]));
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
