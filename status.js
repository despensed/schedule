import { state } from './state.js';
import { DAYS_EN, DAYS_RU, DAYS_SHORT } from './constants.js';
import { escapeHtml } from './utils.js';
import { getSubjectIcon } from './icons.js';
import { getNextEvent } from './events.js';
import {
    formatTime,
    formatProgressDetail,
    heartsFillFraction,
    buildHeartsHtml,
    buildClockHtml,
    updateClockNumbers
} from './format.js';

function updateTitle(timeStr) {
    const t = timeStr ? `${timeStr} · Расписание` : 'Расписание';
    if (t !== state.lastTitleStr) {
        document.title = t;
        state.lastTitleStr = t;
    }
}

export function renderStatus() {
    const home = document.querySelector('#home');
    if (!home) return;
    const now = new Date();
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
        home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Уроков нет · время вне расписания</p>';
        home.dataset.key = 'empty';
        updateTitle('');
        return;
    }

    const timeStr = formatTime(event.remaining);
    const iconHtml = event.type === 'lesson' ? getSubjectIcon(event.subject) : '';
    let title;
    if (event.mode === 'active') title = 'Сейчас';
    else if (isOtherDay) title = `Далее · ${DAYS_SHORT[event.day] || ''}`;
    else title = 'Далее';

    const progress = event.mode === 'upcoming'
        ? 1
        : (event.total > 0 ? event.elapsed / event.total : 0);
    const bounce = state.settings.heartAnimation === 'bounce';
    const detail = formatProgressDetail(event);
    const safeSubject = escapeHtml(event.subject);
    const safeLabel = escapeHtml(event.label);
    const key = `${state.settings.timerStyle}|${event.type}|${event.mode}|${event.subject}|${event.day}|${event.index}|${title}|${bounce}|${detail}`;

    if (home.dataset.key !== key) {
        let timerHtml;
        const style = state.settings.timerStyle;

        if (style === 'bar') {
            const fillColor = event.type === 'lesson' ? 'var(--lesson-color)' : 'var(--break-color)';
            timerHtml = `
                <div class="status-bar">
                    <div class="status-bar-top">
                        <span class="status-bar-time">${timeStr}</span>
                        <span class="status-bar-label">${safeLabel}${detail ? ` · <span class="status-detail-inline">${escapeHtml(detail)}</span>` : ''}</span>
                    </div>
                    <div class="status-bar-track">
                        <div class="status-bar-fill" style="width: ${progress * 100}%; background: ${fillColor};"></div>
                    </div>
                </div>`;
        } else if (style === 'hearts') {
            const filled = heartsFillFraction(progress, event.type, event.mode);
            timerHtml = `
                <div class="status-hearts">
                    <div class="status-hearts-time">${timeStr}</div>
                    <div class="hearts-row">${buildHeartsHtml(filled, bounce)}</div>
                    <div class="status-hearts-label">${safeLabel}${detail ? ` · ${escapeHtml(detail)}` : ''}</div>
                </div>`;
        } else if (style === 'clock') {
            timerHtml = `
                ${buildClockHtml(event.remaining)}
                <div class="status-clock-label">${safeLabel}${detail ? ` · ${escapeHtml(detail)}` : ''}</div>`;
        } else {
            const radius = 52;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference * (1 - progress);
            const ringClass = event.type === 'lesson' ? 'ring-lesson' : 'ring-break';
            timerHtml = `
                <div class="status-ring-container ${ringClass}">
                    <svg class="status-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
                        <circle class="ring-bg" cx="60" cy="60" r="${radius}" />
                        <circle class="ring-fg" cx="60" cy="60" r="${radius}"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${offset}" />
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
                ${detail && style !== 'hearts' && style !== 'clock'
                    ? `<span class="status-detail-inline">· ${escapeHtml(detail)}</span>`
                    : ''}
            </div>`;
        home.dataset.key = key;

        home.classList.remove('animating');
        void home.offsetWidth;
        home.classList.add('animating');
        setTimeout(() => home.classList.remove('animating'), 300);
    } else {
        const timeEl = home.querySelector('.status-ring-time, .status-bar-time, .status-hearts-time');
        if (timeEl) timeEl.textContent = timeStr;

        const style = state.settings.timerStyle;
        if (style === 'ring') {
            const ring = home.querySelector('.ring-fg');
            if (ring) {
                const circumference = 2 * Math.PI * 52;
                ring.setAttribute('stroke-dashoffset', circumference * (1 - progress));
            }
        } else if (style === 'bar') {
            const fill = home.querySelector('.status-bar-fill');
            if (fill) fill.style.width = `${progress * 100}%`;
        } else if (style === 'hearts') {
            const filled = heartsFillFraction(progress, event.type, event.mode);
            home.querySelectorAll('.heart-icon').forEach((svg, i) => {
                const v = Math.min(1, Math.max(0, filled - i));
                const fillPath = svg.querySelector('.heart-fill');
                if (fillPath) {
                    const clip = `inset(0 ${(1 - v) * 100}% 0 0)`;
                    fillPath.style.clipPath = clip;
                    fillPath.style.webkitClipPath = clip;
                }
            });
        } else if (style === 'clock') {
            updateClockNumbers(event.remaining);
        }
    }

    updateTitle(timeStr);
}