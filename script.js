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
    friday: 'Пятница'
};
const DAYS_SHORT = { monday: 'Пн', tuesday: 'Вт', wednesday: 'Ср', thursday: 'Чт', friday: 'Пт' };

const DEFAULT_SETTINGS = {
    theme: 'light',
    timerStyle: 'ring',
    accentColor: '#6366f1',
    lessonColor: '#6366f1',
    breakColor: '#f59e0b',
    backgroundMode: 'orbs',
    particlesCount: 5,
    particlesShape: 'dot',
    particlesBlur: 0,
    gradientColor1: '#a5b4fc',
    gradientColor2: '#f0abfc',
    gradientAngle: 135
};

let settings = { ...DEFAULT_SETTINGS };

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
    'государственный (башкирский) язык рб': 'languages'
};

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

function hasSubject(subject) {
    return typeof subject === 'string' && subject.trim().length > 0;
}

function getSubjectIcon(subject) {
    const key = subject.toLowerCase().trim();
    const iconName = SUBJECT_ICON_MAP[key] || 'bookClosed';
    const path = ICON_PATHS[iconName];
    return `<svg class="subject-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function getBellsForDay(day) {
    if (!scheduleData) return [];
    const useMondayBells = (day === 'monday' || day === 'thursday');
    return useMondayBells ? scheduleData.bells.monday : scheduleData.bells.tuesday_friday;
}

/* === Частицы === */
const particlesState = {
    canvas: null,
    ctx: null,
    list: [],
    animId: null,
    W: 0,
    H: 0,
    dpr: window.devicePixelRatio || 1
};

function particlesResize() {
    if (!particlesState.canvas) return;
    particlesState.W = window.innerWidth;
    particlesState.H = window.innerHeight;
    particlesState.canvas.width = particlesState.W * particlesState.dpr;
    particlesState.canvas.height = particlesState.H * particlesState.dpr;
    particlesState.canvas.style.width = particlesState.W + 'px';
    particlesState.canvas.style.height = particlesState.H + 'px';
    if (particlesState.ctx) {
        particlesState.ctx.setTransform(particlesState.dpr, 0, 0, particlesState.dpr, 0, 0);
    }
}

function particlesRandomShape() {
    const shapes = ['dot', 'heart', 'triangle'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

function particlesCreate() {
    let shape = settings.particlesShape;
    if (shape === 'random') shape = particlesRandomShape();
    return {
        x: Math.random() * particlesState.W,
        y: Math.random() * particlesState.H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 24 + Math.random() * 32,
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        opacity: 0.4 + Math.random() * 0.35
    };
}

function particlesDraw(p, accent) {
    const ctx = particlesState.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = accent;
    const s = p.size;
    if (p.shape === 'dot') {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (p.shape === 'heart') {
        const path = new Path2D(HEART_PATH);
        ctx.save();
        ctx.scale(s / 24, s / 24);
        ctx.translate(-12, -12);
        ctx.fill(path);
        ctx.restore();
    } else {
        ctx.beginPath();
        ctx.moveTo(0, -s / 2);
        ctx.lineTo(s / 2, s / 2);
        ctx.lineTo(-s / 2, s / 2);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function particlesLoop() {
    const ctx = particlesState.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, particlesState.W, particlesState.H);
    ctx.filter = settings.particlesBlur > 0 ? `blur(${settings.particlesBlur}px)` : 'none';
    const accent = settings.accentColor || '#6366f1';
    for (const p of particlesState.list) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.x < -p.size) p.x = particlesState.W + p.size;
        if (p.x > particlesState.W + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = particlesState.H + p.size;
        if (p.y > particlesState.H + p.size) p.y = -p.size;
        particlesDraw(p, accent);
    }
    particlesState.animId = requestAnimationFrame(particlesLoop);
}

function particlesStart() {
    if (!particlesState.canvas || !particlesState.ctx) return;
    particlesStop();
    particlesResize();
    particlesState.list = [];
    const count = Math.max(1, Math.min(10, settings.particlesCount));
    for (let i = 0; i < count; i++) particlesState.list.push(particlesCreate());
    particlesLoop();
}

function particlesStop() {
    if (particlesState.animId) cancelAnimationFrame(particlesState.animId);
    particlesState.animId = null;
    if (particlesState.ctx) {
        particlesState.ctx.clearRect(0, 0, particlesState.W, particlesState.H);
    }
}

function particlesInit() {
    particlesState.canvas = document.getElementById('particles-canvas');
    if (particlesState.canvas) {
        particlesState.ctx = particlesState.canvas.getContext('2d');
    }
    window.addEventListener('resize', () => {
        if (settings.backgroundMode === 'particles') particlesStart();
    });
}

/* === Применение фона === */
function applyBackground() {
    const bgOrbs = document.querySelector('.bg-orbs');
    const bgGrad = document.querySelector('.bg-gradient');
    const bgPart = document.querySelector('.bg-particles');

    if (bgOrbs) bgOrbs.style.display = 'none';
    if (bgGrad) bgGrad.style.display = 'none';
    if (bgPart) bgPart.style.display = 'none';
    particlesStop();

    const mode = settings.backgroundMode;

    if (mode === 'orbs') {
        if (bgOrbs) bgOrbs.style.display = 'block';
    } else if (mode === 'gradient') {
        if (bgGrad) {
            bgGrad.style.display = 'block';
            bgGrad.style.background = `linear-gradient(${settings.gradientAngle}deg, ${settings.gradientColor1}, ${settings.gradientColor2})`;
        }
    } else if (mode === 'particles') {
        if (bgPart) {
            bgPart.style.display = 'block';
            particlesStart();
        }
    }
}

/* === Настройки === */
function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('app-settings') || '{}');
        settings = { ...DEFAULT_SETTINGS, ...saved };
    } catch (e) {
        settings = { ...DEFAULT_SETTINGS };
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') settings.theme = savedTheme;

    if (!['ring', 'bar', 'hearts'].includes(settings.timerStyle)) settings.timerStyle = 'ring';
    if (!['orbs', 'particles', 'gradient', 'none'].includes(settings.backgroundMode)) settings.backgroundMode = 'orbs';
    if (!['dot', 'heart', 'triangle', 'random'].includes(settings.particlesShape)) settings.particlesShape = 'dot';
    if (typeof settings.particlesCount !== 'number') settings.particlesCount = 5;
    if (typeof settings.particlesBlur !== 'number') settings.particlesBlur = 0;
    if (typeof settings.gradientAngle !== 'number') settings.gradientAngle = 135;
}

function saveSettings() {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    localStorage.setItem('theme', settings.theme);
}

function setActiveSegment(containerId, attr, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset[attr] === value);
    });
}

function setColorInput(id, value) {
    const input = document.getElementById(id);
    const label = document.getElementById(`${id}-value`);
    if (input) input.value = value;
    if (label) label.textContent = value;
}

function applySettings() {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--accent-override', settings.accentColor);
    document.documentElement.style.setProperty('--lesson-color-override', settings.lessonColor);
    document.documentElement.style.setProperty('--break-color-override', settings.breakColor);

    setActiveSegment('theme-switch', 'themeValue', settings.theme);
    setActiveSegment('style-switch', 'style', settings.timerStyle);
    setActiveSegment('bg-switch', 'bg', settings.backgroundMode);
    setActiveSegment('particles-shape', 'shape', settings.particlesShape);

    setColorInput('accent-color', settings.accentColor);
    setColorInput('lesson-color', settings.lessonColor);
    setColorInput('break-color', settings.breakColor);

    setColorInput('gradient-color1', settings.gradientColor1);
    setColorInput('gradient-color2', settings.gradientColor2);

    const pc = document.getElementById('particles-count');
    const pcv = document.getElementById('particles-count-value');
    if (pc) pc.value = settings.particlesCount;
    if (pcv) pcv.textContent = settings.particlesCount;

    const pb = document.getElementById('particles-blur');
    const pbv = document.getElementById('particles-blur-value');
    if (pb) pb.value = settings.particlesBlur;
    if (pbv) pbv.textContent = settings.particlesBlur;

    const ga = document.getElementById('gradient-angle');
    const gav = document.getElementById('gradient-angle-value');
    if (ga) ga.value = settings.gradientAngle;
    if (gav) gav.textContent = settings.gradientAngle;

    const particlesGroup = document.getElementById('particles-settings');
    if (particlesGroup) particlesGroup.classList.toggle('visible', settings.backgroundMode === 'particles');

    const gradientGroup = document.getElementById('gradient-settings');
    if (gradientGroup) gradientGroup.classList.toggle('visible', settings.backgroundMode === 'gradient');

    applyBackground();
}

function initSettingsUI() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');

    document.getElementById('menu-toggle').addEventListener('click', () => {
        panel.classList.add('open');
        overlay.classList.add('open');
    });
    const closePanel = () => {
        panel.classList.remove('open');
        overlay.classList.remove('open');
    };
    document.getElementById('settings-close').addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    document.getElementById('theme-switch').addEventListener('click', e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        settings.theme = btn.dataset.themeValue;
        applySettings();
        saveSettings();
    });

    document.getElementById('style-switch').addEventListener('click', e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        settings.timerStyle = btn.dataset.style;
        applySettings();
        saveSettings();
        renderStatus();
    });

    document.getElementById('bg-switch').addEventListener('click', e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        settings.backgroundMode = btn.dataset.bg;
        applySettings();
        saveSettings();
    });

    document.getElementById('particles-shape').addEventListener('click', e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        settings.particlesShape = btn.dataset.shape;
        applySettings();
        saveSettings();
    });

    ['accent', 'lesson', 'break'].forEach(name => {
        const input = document.getElementById(`${name}-color`);
        if (!input) return;
        input.addEventListener('input', () => {
            settings[`${name}Color`] = input.value;
            const label = document.getElementById(`${name}-value`);
            if (label) label.textContent = input.value;
            applySettings();
            saveSettings();
            renderStatus();
        });
    });

    ['gradient-color1', 'gradient-color2'].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        const key = id === 'gradient-color1' ? 'gradientColor1' : 'gradientColor2';
        input.addEventListener('input', () => {
            settings[key] = input.value;
            const label = document.getElementById(`${id}-value`);
            if (label) label.textContent = input.value;
            applySettings();
            saveSettings();
        });
    });

    const pc = document.getElementById('particles-count');
    if (pc) pc.addEventListener('input', () => {
        settings.particlesCount = parseInt(pc.value, 10);
        const label = document.getElementById('particles-count-value');
        if (label) label.textContent = pc.value;
        if (settings.backgroundMode === 'particles') particlesStart();
        saveSettings();
    });

    const pb = document.getElementById('particles-blur');
    if (pb) pb.addEventListener('input', () => {
        settings.particlesBlur = parseInt(pb.value, 10);
        const label = document.getElementById('particles-blur-value');
        if (label) label.textContent = pb.value;
        saveSettings();
    });

    const ga = document.getElementById('gradient-angle');
    if (ga) ga.addEventListener('input', () => {
        settings.gradientAngle = parseInt(ga.value, 10);
        const label = document.getElementById('gradient-angle-value');
        if (label) label.textContent = ga.value;
        applyBackground();
        saveSettings();
    });

    document.getElementById('reset-settings').addEventListener('click', () => {
        settings = { ...DEFAULT_SETTINGS };
        applySettings();
        saveSettings();
        renderStatus();
        renderSchedule(selectedDay);
    });
}

/* === Определение ближайшего события === */
function getNextEvent(now) {
    if (!scheduleData) return null;
    const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const todayIdx = (now.getDay() + 6) % 7;
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    if (todayIdx < 5) {
        const dayName = DAYS_ORDER[todayIdx];
        const bells = getBellsForDay(dayName);
        const lessons = scheduleData.classes[currentClass]?.[dayName] || [];

        for (let i = 0; i < bells.length; i++) {
            const bell = bells[i];
            const [sh, sm] = bell.start.split(':').map(Number);
            const [eh, em] = bell.end.split(':').map(Number);
            const startTotal = sh * 3600 + sm * 60;
            const endTotal = eh * 3600 + em * 60;
            const breakEnd = endTotal + bell.break * 60;
            const subject = lessons[i];
            const realLesson = hasSubject(subject);

            if (!realLesson) continue;

            if (currentSeconds >= startTotal && currentSeconds < endTotal) {
                return { mode: 'active', type: 'lesson', remaining: endTotal - currentSeconds,
                    total: endTotal - startTotal, elapsed: currentSeconds - startTotal,
                    subject, label: `до конца ${bell.lesson} урока`, day: dayName, index: i };
            }
            if (currentSeconds >= endTotal && currentSeconds < breakEnd) {
                return { mode: 'active', type: 'break', remaining: breakEnd - currentSeconds,
                    total: breakEnd - endTotal, elapsed: currentSeconds - endTotal,
                    subject: `Перемена после ${bell.lesson} урока`, label: 'до конца перемены',
                    day: dayName, index: i };
            }
            if (currentSeconds < startTotal) {
                const diff = startTotal - currentSeconds;
                return { mode: 'upcoming', type: 'lesson', remaining: diff,
                    total: diff, elapsed: 0, subject,
                    label: `до начала ${bell.lesson} урока`, day: dayName, index: i };
            }
        }
    }

    for (let offset = 1; offset <= 7; offset++) {
        const nextIdx = (todayIdx + offset) % 7;
        if (nextIdx >= 5) continue;

        const dayName = DAYS_ORDER[nextIdx];
        const bells = getBellsForDay(dayName);
        const lessons = scheduleData.classes[currentClass]?.[dayName] || [];

        for (let i = 0; i < bells.length; i++) {
            const bell = bells[i];
            const subject = lessons[i];
            if (!hasSubject(subject)) continue;

            const [sh, sm] = bell.start.split(':').map(Number);
            const startTotal = sh * 3600 + sm * 60;
            const secondsUntil = (24 * 3600 - currentSeconds) + (offset - 1) * 24 * 3600 + startTotal;

            return { mode: 'upcoming', type: 'lesson', remaining: secondsUntil,
                total: secondsUntil, elapsed: 0, subject,
                label: `${DAYS_SHORT[dayName]}, до начала ${bell.lesson} урока`,
                day: dayName, index: i };
        }
    }
    return null;
}

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}д ${h}ч`;
    if (h > 0) return `${h}ч ${m.toString().padStart(2, '0')}м`;
    if (m > 0) return `${m}м ${s.toString().padStart(2, '0')}с`;
    return `${s}с`;
}

/* === Сердца === */
function heartsFillCount(progress, type) {
    let filled;
    if (type === 'lesson') {
        filled = Math.round((1 - progress) * 10);
    } else {
        filled = Math.round(progress * 10);
    }
    return Math.max(0, Math.min(10, filled));
}

/* === Рендер блока «Сейчас/Далее» === */
function renderStatus() {
    const home = document.querySelector('#home');
    if (!home) return;
    const now = new Date();
    const event = getNextEvent(now);

    if (!event) {
        home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Уроков нет · время вне расписания</p>';
        home.dataset.key = 'empty';
        return;
    }

    const timeStr = formatTime(event.remaining);
    const iconHtml = (event.type === 'lesson') ? getSubjectIcon(event.subject) : '';
    const title = event.mode === 'active' ? 'Сейчас' : 'Далее';
    const progress = event.total > 0 ? (event.elapsed / event.total) : 0;
    const key = `${settings.timerStyle}|${event.type}|${event.mode}|${event.subject}|${event.day}|${event.index}|${title}`;

    if (home.dataset.key !== key) {
        let timerHtml;
        if (settings.timerStyle === 'bar') {
            const fillColor = event.type === 'lesson' ? 'var(--lesson-color)' : 'var(--break-color)';
            timerHtml = `
                <div class="status-bar">
                    <div class="status-bar-top">
                        <span class="status-bar-time">${timeStr}</span>
                        <span class="status-bar-label">${event.label}</span>
                    </div>
                    <div class="status-bar-track">
                        <div class="status-bar-fill" style="width: ${progress * 100}%; background: ${fillColor};"></div>
                    </div>
                </div>
            `;
        } else if (settings.timerStyle === 'hearts') {
            const filled = heartsFillCount(progress, event.type);
            const fillClass = event.type === 'lesson' ? 'filled' : 'filled-break';
            let hearts = '';
            for (let i = 0; i < 10; i++) {
                const cls = i < filled ? `heart-icon ${fillClass}` : 'heart-icon';
                hearts += `<svg class="${cls}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="${HEART_PATH}"/></svg>`;
            }
            timerHtml = `
                <div class="status-hearts">
                    <div class="status-hearts-time">${timeStr}</div>
                    <div class="hearts-row">${hearts}</div>
                    <div class="status-hearts-label">${event.label}</div>
                </div>
            `;
        } else {
            const radius = 52;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference * (1 - progress);
            const ringClass = event.type === 'lesson' ? 'ring-lesson' : 'ring-break';
            timerHtml = `
                <div class="status-ring-container ${ringClass}">
                    <svg class="status-ring-svg" viewBox="0 0 120 120">
                        <circle class="ring-bg" cx="60" cy="60" r="${radius}" />
                        <circle class="ring-fg" cx="60" cy="60" r="${radius}"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${offset}" />
                    </svg>
                    <div class="status-ring-content">
                        <div class="status-ring-time">${timeStr}</div>
                        <div class="status-ring-label">${event.label}</div>
                    </div>
                </div>
            `;
        }

        home.innerHTML = `
            <h2 class="section-title">${title}</h2>
            ${timerHtml}
            <div class="status-ring-subject">
                ${iconHtml}
                <span>${event.subject}</span>
            </div>
        `;
        home.dataset.key = key;
    } else {
        const timeEl = home.querySelector('.status-ring-time, .status-bar-time, .status-hearts-time');
        if (timeEl) timeEl.textContent = timeStr;

        if (settings.timerStyle === 'ring') {
            const ring = home.querySelector('.ring-fg');
            if (ring) {
                const radius = 52;
                const circumference = 2 * Math.PI * radius;
                ring.setAttribute('stroke-dashoffset', circumference * (1 - progress));
            }
        } else if (settings.timerStyle === 'bar') {
            const fill = home.querySelector('.status-bar-fill');
            if (fill) fill.style.width = `${progress * 100}%`;
        } else if (settings.timerStyle === 'hearts') {
            const filled = heartsFillCount(progress, event.type);
            const fillClass = event.type === 'lesson' ? 'filled' : 'filled-break';
            const icons = home.querySelectorAll('.heart-icon');
            icons.forEach((icon, i) => {
                icon.setAttribute('class', i < filled ? `heart-icon ${fillClass}` : 'heart-icon');
            });
        }
    }
}

/* === Расписание === */
function getLessonStatus(day, index, bells) {
    const now = new Date();
    const today = DAYS_EN[now.getDay()];
    if (day !== today) return 'normal';

    const bell = bells[index];
    if (!bell) return 'normal';
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const [sh, sm] = bell.start.split(':').map(Number);
    const [eh, em] = bell.end.split(':').map(Number);
    const startTotal = sh * 3600 + sm * 60;
    const endTotal = eh * 3600 + em * 60;

    if (currentSeconds > endTotal) return 'past';
    if (currentSeconds >= startTotal) return 'current';
    return 'normal';
}

function renderSchedule(day) {
    if (!scheduleData) return;

    document.querySelectorAll('nav ul li a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === `#${day}`) a.classList.add('active');
    });

    const bells = getBellsForDay(day);
    const lessons = scheduleData.classes[currentClass]?.[day] || [];

    let listHtml = '';
    lessons.forEach((subject, index) => {
        const bell = bells[index];
        if (bell && hasSubject(subject)) {
            const status = getLessonStatus(day, index, bells);
            const statusClass = status === 'normal' ? '' : ` class="${status}"`;
            listHtml += `
                <li${statusClass}>
                    <span class="lesson-num">${bell.lesson} урок</span>
                    <span class="lesson-time">${bell.start} – ${bell.end}</span>
                    <span class="lesson-subject">
                        ${getSubjectIcon(subject)}
                        <span>${subject}</span>
                    </span>
                </li>`;
        }
    });

    let html = `<h2>${DAYS_RU[day] || ''}</h2>`;
    if (listHtml) {
        html += `<ul class="schedule-list">${listHtml}</ul>`;
    } else {
        html += '<p class="status-text-only">В этот день уроков нет.</p>';
    }

    let container = document.getElementById('schedule-view');
    if (!container) {
        container = document.createElement('section');
        container.id = 'schedule-view';
        document.querySelector('main').appendChild(container);
    }
    container.innerHTML = html;
}

/* === Инициализация === */
async function init() {
    particlesInit();
    loadSettings();
    applySettings();
    initSettingsUI();

    try {
        const response = await fetch('schedule.json');
        scheduleData = await response.json();

        const now = new Date();
        currentActualDay = DAYS_EN[now.getDay()];
        selectedDay = currentActualDay;

        renderSchedule(selectedDay);
        renderStatus();

        setInterval(() => {
            const now = new Date();
            const today = DAYS_EN[now.getDay()];
            if (currentActualDay !== today) {
                currentActualDay = today;
                selectedDay = today;
            }
            renderSchedule(selectedDay);
            renderStatus();
        }, 1000);

        document.querySelectorAll('nav ul li a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const day = link.getAttribute('href').substring(1);
                selectedDay = day;
                renderSchedule(day);
            });
        });

    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        document.querySelector('#home').innerHTML =
            '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Ошибка загрузки данных. Проверьте, запущен ли локальный сервер.</p>';
    }
}

window.addEventListener('DOMContentLoaded', init);
