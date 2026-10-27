import { state } from './state.js';
import { DAYS_EN, DAYS_RU, DAYS_ORDER, DAYS_SHORT } from './constants.js';
import { escapeHtml, schoolNow } from './utils.js';
import { getSubjectIcon } from './icons.js';
import { getNextEvent } from './events.js';
import {
    formatTime,
    formatProgressDetail,
    heartsFillFraction,
    buildHeartsHtml, heartState, buildCellsHtml, updateCells,
    buildClockHtml,
    updateClockNumbers
} from './format.js';

/** Таймер снятия класса .animating — общий, чтобы не наслаивался. */
let animTimer = 0;

function updateTitle(timeStr) {
    const t = timeStr ? `${timeStr} · Расписание` : 'Расписание';
    if (t !== state.lastTitleStr) {
        document.title = t;
        state.lastTitleStr = t;
    }
}

function dayDistanceLabel(day, now) {
    const todayIdx = (now.getDay() + 6) % 7;
    const targetIdx = DAYS_ORDER.indexOf(day);
    if (targetIdx < 0) return 'Далее';

    let diff = targetIdx - todayIdx;
    if (diff <= 0) diff += 7;

    if (diff === 1) return 'Завтра';
    if (diff === 2) return 'Послезавтра';

    const mod10 = diff % 10;
    const mod100 = diff % 100;
    let word = 'дней';
    if (mod10 === 1 && mod100 !== 11) word = 'день';
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'дня';

    return `Через ${diff} ${word}`;
}

export function renderStatus() {
    const home = document.querySelector('#home');
    if (!home) return;

    if (!state.schedule) return;
    const now = schoolNow();
    const event = getNextEvent(now, state.selectedDay);

    home.classList.toggle('event-lesson', !!event && event.type === 'lesson');
    home.classList.toggle('event-break', !!event && event.type === 'break');
    home.classList.toggle('event-upcoming', !!event && event.mode === 'upcoming');

    const todayName = DAYS_EN[now.getDay()];
    const isOtherDay = event && event.day && event.day !== todayName;

    if (event && event.mode === 'empty') {
        home.innerHTML = `<h2 class="section-title">${escapeHtml(DAYS_RU[event.day] || '')}</h2><p class="status-text-only">В этот день уроков нет.</p>`;
        home.dataset.key = `empty-${event.day}`;
        updateTitle('');
        return;
    }
    if (!event) {
        home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Уроков нет — время вне расписания</p>';
        home.dataset.key = 'empty';
        updateTitle('');
        return;
    }

    const timeStr = formatTime(event.remaining);
    const iconHtml = event.type === 'lesson' ? getSubjectIcon(event.subject) : '';

    let title;
    if (event.mode === 'active') title = 'Сейчас';
    else if (isOtherDay) title = `${dayDistanceLabel(event.day, now)} · ${DAYS_SHORT[event.day] || ''}`;
    else title = 'Далее';

    const progress = event.mode === 'upcoming'
        ? 1
        : (event.total > 0 ? event.elapsed / event.total : 0);
    const bounce = state.settings.heartAnimation === 'bounce';
    const detail = event.mode === 'upcoming' ? '' : formatProgressDetail(event);

    const detailSuffixHtml = detail
        ? `<span class="status-detail-suffix"> · ${escapeHtml(detail)}</span>`
        : '';
    const detailInlineHtml = detail
        ? `<span class="status-detail-inline">· ${escapeHtml(detail)}</span>`
        : '';

    const safeSubject = escapeHtml(event.subject);
    const safeLabel = escapeHtml(event.label);

    const key = `${state.settings.timerStyle}|${event.type}|${event.mode}|${event.subject}|${event.day}|${event.index}|${title}|${bounce}`;

    if (home.dataset.key !== key) {
        let timerHtml;
        const style = state.settings.timerStyle;

        if (style === 'bar') {
            const fillColor = event.type === 'lesson' ? 'var(--lesson-color)' : 'var(--break-color)';
            timerHtml = `
                <div class="status-bar">
                    <div class="status-bar-top">
                        <span class="status-bar-time">${timeStr}</span>
                        <span class="status-bar-label">${safeLabel}</span>
                    </div>
                    <div class="status-bar-track">
                        <div class="status-bar-fill" style="width: ${progress * 100}%; background: ${fillColor};"></div>
                    </div>
                </div>`;
        } else if (style === 'hearts') {
            const filled = heartsFillFraction(progress, event.mode);
            timerHtml = `
                <div class="status-hearts">
                    <div class="status-hearts-time">${timeStr}</div>
                    <div class="hearts-row">${buildHeartsHtml(filled, bounce)}</div>
                    <div class="status-hearts-label">${safeLabel}${detailSuffixHtml}</div>
                </div>`;
        } else if (style === 'cells') {
            timerHtml = `
                <div class="status-bar">
                    <div class="status-bar-top">
                        <span class="status-bar-time">${timeStr}</span>
                        <span class="status-bar-label">${safeLabel}</span>
                    </div>
                    ${buildCellsHtml(event)}
                </div>`;
        } else if (style === 'clock') {
            timerHtml = `
                ${buildClockHtml(event.remaining)}
                <div class="status-clock-label">${safeLabel}${detailSuffixHtml}</div>`;
        } else {
            const radius = 52;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference * (1 - progress);
            const ringClass = event.type === 'lesson' ? 'ring-lesson' : 'ring-break';
            timerHtml = `
                <div class="status-ring-container ${ringClass}">
                    <svg class="status-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
                        <circle class="ring-bg" cx="60" cy="60" r="${radius}"
                                stroke-dasharray="1.6 ${(circumference / 60 - 1.6).toFixed(2)}" />
                        <circle class="ring-fg" cx="60" cy="60" r="${radius}"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${offset}" />
                        <g class="ring-hand" style="transform: rotate(${(progress * 360).toFixed(1)}deg)">
                            <line x1="60" y1="60" x2="60" y2="${60 - radius + 7}" />
                            <circle cx="60" cy="${60 - radius}" r="4.5" />
                        </g>
                    </svg>
                    <div class="status-ring-content">
                        <div class="status-ring-time">${timeStr}</div>
                        <div class="status-ring-label">${safeLabel}</div>
                    </div>
                </div>`;
        }

        home.innerHTML = `
            <h2 class="section-title">${escapeHtml(title)}</h2>
            ${timerHtml}
            <div class="status-ring-subject">
                ${iconHtml}
                <span>${safeSubject}</span>
                ${detailInlineHtml}
            </div>`;
        home.dataset.key = key;

        // Смену карточки анимируем только внутри одного дня (урок → перемена),
        // при переключении дня карточка меняется без анимации.
        const sameDay = home.dataset.day === state.selectedDay;
        home.dataset.day = state.selectedDay;
        if (sameDay) {
            home.classList.remove('animating');
            void home.offsetWidth;
            home.classList.add('animating');
            // Предыдущий таймер нельзя оставлять: он снял бы класс
            // посреди новой анимации и карточка «залипла» бы полупрозрачной.
            clearTimeout(animTimer);
            animTimer = setTimeout(() => home.classList.remove('animating'), 300);
        }
    } else {
        const timeEl = home.querySelector('.status-ring-time, .status-bar-time, .status-hearts-time');
        if (timeEl) timeEl.textContent = timeStr;

        const suffix = home.querySelector('.status-detail-suffix');
        if (suffix) suffix.textContent = detail ? ` · ${detail}` : '';
        const inline = home.querySelector('.status-detail-inline');
        if (inline) inline.textContent = detail ? `· ${detail}` : '';

        const style = state.settings.timerStyle;
        if (style === 'ring') {
            const ring = home.querySelector('.ring-fg');
            if (ring) {
                const circumference = 2 * Math.PI * 52;
                ring.setAttribute('stroke-dashoffset', circumference * (1 - progress));
                const hand = home.querySelector('.ring-hand');
                if (hand) hand.style.transform = `rotate(${(progress * 360).toFixed(1)}deg)`;
            }
        } else if (style === 'bar') {
            const fill = home.querySelector('.status-bar-fill');
            if (fill) fill.style.width = `${progress * 100}%`;
        } else if (style === 'hearts') {
            const filled = heartsFillFraction(progress, event.mode);
            home.querySelectorAll('.heart-icon').forEach((svg, i) => {
                const st = String(heartState(Math.min(1, Math.max(0, filled - i))));
                if (svg.dataset.s !== st) svg.dataset.s = st;
            });
        } else if (style === 'cells') {
            updateCells(home, event);
        } else if (style === 'clock') {
            updateClockNumbers(event.remaining);
        }
    }

    updateTitle(timeStr);
}
