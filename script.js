let scheduleData = null;
const currentClass = '10А';
let selectedDay = 'monday';
let currentActualDay = null;

const DAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_RU = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье'
};

const ICON_PATHS = {
    book:        '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    bookClosed:  '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    history:     '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/>',
    users:       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    globe:       '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    leaf:        '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
    sigma:       '<path d="M18 4H6l6 8-6 8h12"/>',
    triangle:    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
    chart:       '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    languages:   '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    atom:        '<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>',
    code:        '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    flask:       '<path d="M9 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 8V2"/><line x1="9" y1="2" x2="15" y2="2"/><line x1="6" y1="15" x2="18" y2="15"/>',
    activity:    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    shield:      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    lightbulb:   '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
    message:     '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'
};

const SUBJECT_ICON_MAP = {
    'русский язык': 'book',
    'литература': 'book',
    'родная литература': 'book',
    'родной язык': 'book',
    'история': 'history',
    'обществознание': 'users',
    'география': 'globe',
    'биология': 'leaf',
    'алгебра': 'sigma',
    'геометрия': 'triangle',
    'вероятность и статистика': 'chart',
    'иностранный язык': 'languages',
    'физика': 'atom',
    'информатика': 'code',
    'химия': 'flask',
    'физическая культура': 'activity',
    'обж': 'shield',
    'индивидуальный проект': 'lightbulb',
    'разговоры о важном': 'message',
    'государственный(башкирский)язык рб': 'languages',
    'государственный (башкирский)язык рб': 'languages'
};

function getSubjectIcon(subject) {
    const key = subject.toLowerCase().trim();
    const iconName = SUBJECT_ICON_MAP[key] || 'bookClosed';
    const path = ICON_PATHS[iconName];
    return `<svg class="subject-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

async function init() {
    initTheme();

    try {
        const response = await fetch('schedule.json');
        scheduleData = await response.json();

        const now = new Date();
        currentActualDay = DAYS_EN[now.getDay()];
        selectedDay = currentActualDay;

        renderSchedule(selectedDay);
        updateStatus();

        setInterval(updateStatus, 1000);

        document.querySelectorAll('nav ul li a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const day = link.getAttribute('href').substring(1);
                selectedDay = day;
                renderSchedule(day);
                updateStatus();
            });
        });

    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        document.querySelector('#home').innerHTML =
            '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Ошибка загрузки данных. Проверьте, запущен ли локальный сервер.</p>';
    }
}

function renderSchedule(day) {
    if (!scheduleData) return;

    document.querySelectorAll('nav ul li a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === `#${day}`) a.classList.add('active');
    });

    const bells = (day === 'monday') ? scheduleData.bells.monday : scheduleData.bells.tuesday_friday;
    const lessons = scheduleData.classes[currentClass]?.[day] || [];

    let html = `<h2>${DAYS_RU[day]} · ${currentClass}</h2>`;

    if (lessons.length === 0) {
        html += '<p class="status-text-only">В этот день уроков нет.</p>';
    } else {
        html += '<ul class="schedule-list">';
        lessons.forEach((subject, index) => {
            const bell = bells[index];
            if (bell) {
                html += `
                    <li>
                        <span class="lesson-num">${bell.lesson} урок</span>
                        <span class="lesson-time">${bell.start} – ${bell.end}</span>
                        <span class="lesson-subject">
                            ${getSubjectIcon(subject)}
                            <span>${subject}</span>
                        </span>
                    </li>`;
            }
        });
        html += '</ul>';
    }

    let container = document.getElementById('schedule-view');
    if (!container) {
        container = document.createElement('section');
        container.id = 'schedule-view';
        document.querySelector('main').appendChild(container);
    }
    container.innerHTML = html;
}

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}ч ${m.toString().padStart(2, '0')}м`;
    if (m > 0) return `${m}м ${s.toString().padStart(2, '0')}с`;
    return `${s}с`;
}

function updateStatus() {
    if (!scheduleData) return;

    const home = document.querySelector('#home');
    const now = new Date();
    const today = DAYS_EN[now.getDay()];

    if (currentActualDay !== today) {
        currentActualDay = today;
        selectedDay = today;
        renderSchedule(today);
    }

    if (selectedDay !== today) {
        home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Выбран другой день. Статус доступен только для сегодняшнего дня.</p>';
        return;
    }

    const bells = (today === 'monday') ? scheduleData.bells.monday : scheduleData.bells.tuesday_friday;
    const lessons = scheduleData.classes[currentClass]?.[today] || [];

    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let found = null;

    for (let i = 0; i < bells.length; i++) {
        const bell = bells[i];
        const [startH, startM] = bell.start.split(':').map(Number);
        const [endH, endM] = bell.end.split(':').map(Number);

        const startTotal = startH * 3600 + startM * 60;
        const endTotal = endH * 3600 + endM * 60;
        const breakEnd = endTotal + bell.break * 60;

        if (currentSeconds >= startTotal && currentSeconds < endTotal) {
            found = {
                type: 'lesson',
                remaining: endTotal - currentSeconds,
                total: endTotal - startTotal,
                elapsed: currentSeconds - startTotal,
                subject: lessons[i] || 'Нет предмета',
                label: `до конца ${bell.lesson} урока`
            };
            break;
        } else if (currentSeconds >= endTotal && currentSeconds < breakEnd) {
            found = {
                type: 'break',
                remaining: breakEnd - currentSeconds,
                total: breakEnd - endTotal,
                elapsed: currentSeconds - endTotal,
                subject: `Перемена после ${bell.lesson} урока`,
                label: 'до конца перемены'
            };
            break;
        }
    }

    if (!found) {
        home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Уроков нет · время вне расписания</p>';
        return;
    }

    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const progress = found.elapsed / found.total;
    const offset = circumference * (1 - progress);
    const ringClass = found.type === 'lesson' ? 'ring-lesson' : 'ring-break';

    const iconHtml = found.type === 'lesson' ? getSubjectIcon(found.subject) : '';

    home.innerHTML = `
        <h2 class="section-title">Сейчас</h2>
        <div class="status-ring-container ${ringClass}">
            <svg class="status-ring-svg" viewBox="0 0 120 120">
                <circle class="ring-bg" cx="60" cy="60" r="${radius}" />
                <circle class="ring-fg" cx="60" cy="60" r="${radius}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}" />
            </svg>
            <div class="status-ring-content">
                <div class="status-ring-time">${formatTime(found.remaining)}</div>
                <div class="status-ring-label">${found.label}</div>
            </div>
        </div>
        <div class="status-ring-subject">
            ${iconHtml}
            <span>${found.subject}</span>
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', init);