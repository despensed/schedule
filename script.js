let scheduleData = null;
let selectedDay = 'monday';
let currentActualDay = null;
let manualDaySelection = false;
let lastTitleStr = '';
let statusInterval = null;
let tickCounter = 0;

const DAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_RU = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница'
};
const DAYS_SHORT = { monday: 'Пн', tuesday: 'Вт', wednesday: 'Ср', thursday: 'Чт', friday: 'Пт' };
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

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
    gradientAngle: 135,
    glowIntensity: 'off',
    heartOutlineColor: '#6366f1',
    heartOutlineCustom: false,
    heartAnimation: 'none',
    notificationsEnabled: false
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

const SYSTEM_THEME_MQL = window.matchMedia('(prefers-color-scheme: dark)');

/* === Утилиты === */
function hasSubject(subject) {
    return typeof subject === 'string' && subject.trim().length > 0;
}

function pickTextColor(hex) {
    const c = String(hex).replace('#', '');
    if (c.length !== 6) return '#ffffff';
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 160 ? '#0f172a' : '#ffffff';
}

function getSubjectIcon(subject) {
    const key = subject.toLowerCase().trim();
    const iconName = SUBJECT_ICON_MAP[key] || 'bookClosed';
    const path = ICON_PATHS[iconName];
    return `<svg class="subject-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function getLessonsForDay(day) {
    return (scheduleData && scheduleData.days && scheduleData.days[day]) || [];
}

function getBellsForDay(day) {
    if (!scheduleData) return [];
    const useMondayBells = (day === 'monday' || day === 'thursday');
    return useMondayBells ? scheduleData.bells.monday : scheduleData.bells.tuesday_friday;
}

function dayHasLessons(day) {
    return getLessonsForDay(day).some(hasSubject);
}

function getSchoolDay(dayName) {
    return DAYS_RU[dayName] ? dayName : 'monday';
}

function formatMinutes(seconds) {
    return Math.max(0, Math.round(seconds / 60));
}

/* === Hash-навигация === */
function writeHash(day) {
    const target = `#${day}`;
    if (location.hash === target) return;
    try {
        history.replaceState(null, '', target);
    } catch (e) {
        location.hash = day;
    }
}

function readHashDay() {
    const h = location.hash.slice(1);
    return DAYS_ORDER.includes(h) ? h : null;
}

/* === Частицы === */
const particlesState = {
    canvas: null,
    ctx: null,
    list: [],
    animId: null,
    W: 0,
    H: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 1.5)
};

function particlesResize() {
    if (!particlesState.canvas) return;
    particlesState.W = window.innerWidth;
    particlesState.H = window.innerHeight;
    particlesState.canvas.width = Math.floor(particlesState.W * particlesState.dpr);
    particlesState.canvas.height = Math.floor(particlesState.H * particlesState.dpr);
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

function particlesBuildSprite(shape, size) {
    const blurPx = Math.max(0, settings.particlesBlur | 0);
    const color = settings.accentColor || '#6366f1';
    const dpr = particlesState.dpr;
    const pad = blurPx * 3 + 8;
    const dim = size + pad * 2;

    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(dim * dpr));
    cv.height = Math.max(1, Math.ceil(dim * dpr));
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
    c.fillStyle = color;
    c.translate(pad + size / 2, pad + size / 2);

    if (shape === 'dot') {
        c.beginPath();
        c.arc(0, 0, size / 2, 0, Math.PI * 2);
        c.fill();
    } else if (shape === 'heart') {
        const path = new Path2D(HEART_PATH);
        c.save();
        c.scale(size / 24, size / 24);
        c.translate(-12, -12);
        c.fill(path);
        c.restore();
    } else {
        c.beginPath();
        c.moveTo(0, -size / 2);
        c.lineTo(size / 2, size / 2);
        c.lineTo(-size / 2, size / 2);
        c.closePath();
        c.fill();
    }

    return { cv, dim, pad };
}

function particlesCreate() {
    let shape = settings.particlesShape;
    if (shape === 'random') shape = particlesRandomShape();

    const size = 24 + Math.random() * 32;
    return {
        x: Math.random() * particlesState.W,
        y: Math.random() * particlesState.H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size,
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        opacity: 0.4 + Math.random() * 0.35,
        sprite: particlesBuildSprite(shape, size)
    };
}

function particlesDraw(p) {
    const ctx = particlesState.ctx;
    const s = p.sprite;
    if (!s) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.drawImage(s.cv, -s.dim / 2, -s.dim / 2, s.dim, s.dim);
    ctx.restore();
}

function particlesLoop() {
    const ctx = particlesState.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, particlesState.W, particlesState.H);
    for (const p of particlesState.list) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.x < -p.size) p.x = particlesState.W + p.size;
        if (p.x > particlesState.W + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = particlesState.H + p.size;
        if (p.y > particlesState.H + p.size) p.y = -p.size;
        particlesDraw(p);
    }
    particlesState.animId = requestAnimationFrame(particlesLoop);
}

function particlesStart() {
    if (!particlesState.canvas || !particlesState.ctx) return;
    particlesStop();
    particlesResize();
    particlesState.list = [];
    const count = Math.max(1, Math.min(10, settings.particlesCount | 0));
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

    let resizeTimer;
    window.addEventListener('resize', () => {
        if (settings.backgroundMode !== 'particles') return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(particlesStart, 150);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            particlesStop();
        } else if (settings.backgroundMode === 'particles') {
            particlesStart();
        }
    });
}

/* === Фон === */
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

    const explicitTheme = localStorage.getItem('theme-explicit') === '1';
    const savedTheme = localStorage.getItem('theme');
    if (explicitTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        settings.theme = savedTheme;
    } else {
        settings.theme = SYSTEM_THEME_MQL.matches ? 'dark' : 'light';
    }

    if (!['ring', 'bar', 'hearts'].includes(settings.timerStyle)) settings.timerStyle = 'ring';
    if (!['orbs', 'particles', 'gradient', 'none'].includes(settings.backgroundMode)) settings.backgroundMode = 'orbs';
    if (!['dot', 'heart', 'triangle', 'random'].includes(settings.particlesShape)) settings.particlesShape = 'dot';
    if (!['off', 'soft', 'strong'].includes(settings.glowIntensity)) settings.glowIntensity = 'off';
    if (!['none', 'bounce'].includes(settings.heartAnimation)) settings.heartAnimation = 'none';
    if (typeof settings.particlesCount !== 'number') settings.particlesCount = 5;
    if (typeof settings.particlesBlur !== 'number') settings.particlesBlur = 0;
    if (typeof settings.gradientAngle !== 'number') settings.gradientAngle = 135;
    if (typeof settings.notificationsEnabled !== 'boolean') settings.notificationsEnabled = false;
    if (typeof settings.heartOutlineCustom !== 'boolean') settings.heartOutlineCustom = false;

    // Если пользователь не трогал обводку сердец — синхронизируем с цветом урока
    if (!settings.heartOutlineCustom) {
        settings.heartOutlineColor = settings.lessonColor;
    }
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

function glowToBlur(intensity) {
    if (intensity === 'soft') return '8px';
    if (intensity === 'strong') return '18px';
    return '0px';
}

function applySettings() {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--accent-override', settings.accentColor);
    document.documentElement.style.setProperty('--accent-text-override', pickTextColor(settings.accentColor));
    document.documentElement.style.setProperty('--lesson-color-override', settings.lessonColor);
    document.documentElement.style.setProperty('--break-color-override', settings.breakColor);
    document.documentElement.style.setProperty('--heart-outline-override', settings.heartOutlineColor);
    document.documentElement.style.setProperty('--glow-blur-override', glowToBlur(settings.glowIntensity));

    setActiveSegment('theme-switch', 'themeValue', settings.theme);
    setActiveSegment('style-switch', 'style', settings.timerStyle);
    setActiveSegment('bg-switch', 'bg', settings.backgroundMode);
    setActiveSegment('particles-shape', 'shape', settings.particlesShape);
    setActiveSegment('glow-switch', 'glow', settings.glowIntensity);
    setActiveSegment('heart-anim-switch', 'heartAnim', settings.heartAnimation);
    setActiveSegment('notify-switch', 'notify', settings.notificationsEnabled ? 'on' : 'off');

    setColorInput('accent-color', settings.accentColor);
    setColorInput('lesson-color', settings.lessonColor);
    setColorInput('break-color', settings.breakColor);
    setColorInput('heart-outline-color', settings.heartOutlineColor);

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

    const heartGroup = document.getElementById('heart-settings');
    if (heartGroup) heartGroup.classList.toggle('visible', settings.timerStyle === 'hearts');

    updateNotifyHint();
    applyBackground();
}

function updateNotifyHint() {
    const hint = document.getElementById('notify-hint');
    if (!hint) return;
    if (!('Notification' in window)) {
        hint.textContent = 'Браузер не поддерживает уведомления';
        return;
    }
    if (!settings.notificationsEnabled) {
        hint.textContent = '';
        return;
    }
    if (Notification.permission === 'granted') {
        hint.textContent = 'Уведомления включены';
    } else if (Notification.permission === 'denied') {
        hint.textContent = 'Разрешение отклонено в настройках браузера';
    } else {
        hint.textContent = 'Ожидается разрешение...';
    }
}

function initSettingsUI() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');

    const openPanel = () => {
        panel.classList.add('open');
        overlay.classList.add('open');
    };
    const closePanel = () => {
        panel.classList.remove('open');
        overlay.classList.remove('open');
    };

    document.getElementById('menu-toggle').addEventListener('click', openPanel);
    document.getElementById('settings-close').addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    document.getElementById('theme-switch').addEventListener('click', e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        settings.theme = btn.dataset.themeValue;
        localStorage.setItem('theme-explicit', '1');
        applySettings();
        saveSettings();
    });

    document.getElementById('notify-switch').addEventListener('click', async e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        const value = btn.dataset.notify;
        if (value === 'on') {
            if (!('Notification' in window)) {
                settings.notificationsEnabled = false;
            } else if (Notification.permission === 'granted') {
                settings.notificationsEnabled = true;
            } else if (Notification.permission === 'denied') {
                settings.notificationsEnabled = false;
            } else {
                try {
                    const perm = await Notification.requestPermission();
                    settings.notificationsEnabled = (perm === 'granted');
                } catch (err) {
                    settings.notificationsEnabled = false;
                }
            }
        } else {
            settings.notificationsEnabled = false;
        }
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

    document.getElementById('glow-switch').addEventListener('click', e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        settings.glowIntensity = btn.dataset.glow;
        applySettings();
        saveSettings();
    });

    document.getElementById('heart-anim-switch').addEventListener('click', e => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        settings.heartAnimation = btn.dataset.heartAnim;
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
            // Авто-синхронизация обводки сердец с цветом урока, если пользователь не фиксировал её вручную
            if (name === 'lesson' && !settings.heartOutlineCustom) {
                settings.heartOutlineColor = input.value;
            }
            applySettings();
            saveSettings();
            renderStatus();
        });
    });

    const heartOutline = document.getElementById('heart-outline-color');
    if (heartOutline) heartOutline.addEventListener('input', () => {
        settings.heartOutlineColor = heartOutline.value;
        settings.heartOutlineCustom = true;
        const label = document.getElementById('heart-outline-color-value');
        if (label) label.textContent = heartOutline.value;
        applySettings();
        saveSettings();
    });

    const heartReset = document.getElementById('heart-outline-reset');
    if (heartReset) heartReset.addEventListener('click', () => {
        settings.heartOutlineCustom = false;
        settings.heartOutlineColor = settings.lessonColor;
        applySettings();
        saveSettings();
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
        if (settings.backgroundMode === 'particles') particlesStart();
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
        localStorage.removeItem('theme-explicit');
        settings.theme = SYSTEM_THEME_MQL.matches ? 'dark' : 'light';
        settings.heartOutlineColor = settings.lessonColor;
        applySettings();
        saveSettings();
        renderStatus();
        renderSchedule(selectedDay);
    });
}

/* === Определение ближайшего события === */
function firstLessonOfDay(day, currentSeconds, todayIdx) {
    const targetIdx = DAYS_ORDER.indexOf(day);
    if (targetIdx < 0) return null;
    let offset = targetIdx - todayIdx;
    if (offset <= 0) offset += 7;

    const bells = getBellsForDay(day);
    const lessons = getLessonsForDay(day);
    for (let i = 0; i < bells.length; i++) {
        if (!hasSubject(lessons[i])) continue;
        const bell = bells[i];
        const [sh, sm] = bell.start.split(':').map(Number);
        const startTotal = sh * 3600 + sm * 60;
        const secondsUntil = (24 * 3600 - currentSeconds) + (offset - 1) * 24 * 3600 + startTotal;
        return {
            mode: 'upcoming', type: 'lesson', remaining: secondsUntil,
            total: secondsUntil, elapsed: 0, subject: lessons[i],
            label: `${DAYS_SHORT[day]} · до начала ${bell.lesson} урока`,
            day, index: i
        };
    }
    return null;
}

function getNextEvent(now, selected) {
    if (!scheduleData) return null;
    const todayIdx = (now.getDay() + 6) % 7;
    const isWeekend = todayIdx >= 5;
    const todayName = isWeekend ? null : DAYS_ORDER[todayIdx];
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    // Пользователь открыл другой день
    if (selected && selected !== todayName && DAYS_ORDER.includes(selected)) {
        if (!dayHasLessons(selected)) {
            return { mode: 'empty', day: selected };
        }
        const ev = firstLessonOfDay(selected, currentSeconds, todayIdx);
        if (ev) return ev;
    }

    // Логика текущего дня
    if (!isWeekend) {
        const dayName = todayName;
        const bells = getBellsForDay(dayName);
        const lessons = getLessonsForDay(dayName);

        for (let i = 0; i < bells.length; i++) {
            const bell = bells[i];
            const [sh, sm] = bell.start.split(':').map(Number);
            const [eh, em] = bell.end.split(':').map(Number);
            const startTotal = sh * 3600 + sm * 60;
            const endTotal = eh * 3600 + em * 60;
            const breakEnd = endTotal + bell.break * 60;
            const subject = lessons[i];

            if (!hasSubject(subject)) continue;

            if (currentSeconds >= startTotal && currentSeconds < endTotal) {
                return { mode: 'active', type: 'lesson', remaining: endTotal - currentSeconds,
                    total: endTotal - startTotal, elapsed: currentSeconds - startTotal,
                    subject, label: `до конца ${bell.lesson} урока`, day: dayName, index: i };
            }
            if (currentSeconds >= endTotal && currentSeconds < breakEnd) {
                return { mode: 'active', type: 'break', remaining: breakEnd - currentSeconds,
                    total: breakEnd - endTotal, elapsed: currentSeconds - endTotal,
                    subject: `Перемена после ${bell.lesson} урока`, label: 'перемена',
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
        const lessons = getLessonsForDay(dayName);

        for (let i = 0; i < bells.length; i++) {
            const bell = bells[i];
            const subject = lessons[i];
            if (!hasSubject(subject)) continue;

            const [sh, sm] = bell.start.split(':').map(Number);
            const startTotal = sh * 3600 + sm * 60;
            const secondsUntil = (24 * 3600 - currentSeconds) + (offset - 1) * 24 * 3600 + startTotal;

            return { mode: 'upcoming', type: 'lesson', remaining: secondsUntil,
                total: secondsUntil, elapsed: 0, subject,
                label: `${DAYS_SHORT[dayName]} · до начала ${bell.lesson} урока`,
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

function heartClass(isFilled, fillClass, bounce) {
    let c = 'heart-icon';
    if (isFilled) c += ` ${fillClass}`;
    if (bounce) c += ' bouncing';
    return c;
}

/* Прогресс-деталь: «5 из 40 мин» */
function formatProgressDetail(event) {
    if (!event || !event.total || event.total < 60) return '';
    const totalMin = Math.max(1, Math.round(event.total / 60));
    if (event.mode === 'upcoming') return `осталось ${totalMin} мин`;
    const elapsedMin = Math.max(0, Math.min(totalMin, Math.floor(event.elapsed / 60)));
    return `${elapsedMin} из ${totalMin} мин`;
}

/* === Рендер «Сейчас/Далее» === */
function renderStatus() {
    const home = document.querySelector('#home');
    if (!home) return;
    const now = new Date();
    const event = getNextEvent(now, selectedDay);

    home.classList.toggle('event-lesson', !!event && event.type === 'lesson');
    home.classList.toggle('event-break', !!event && event.type === 'break');

    const todayName = DAYS_EN[now.getDay()];
    const isOtherDay = event && event.day && event.day !== todayName;

    // Пустой выбранный день
    if (event && event.mode === 'empty') {
        const title = DAYS_RU[event.day] || '';
        home.innerHTML = `<h2 class="section-title">${title}</h2><p class="status-text-only">В этот день уроков нет.</p>`;
        home.dataset.key = `empty-${event.day}`;
        updateTitle('', null);
        return;
    }

    if (!event) {
        home.innerHTML = '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Уроков нет · время вне расписания</p>';
        home.dataset.key = 'empty';
        updateTitle('', null);
        return;
    }

    const timeStr = formatTime(event.remaining);
    const iconHtml = (event.type === 'lesson') ? getSubjectIcon(event.subject) : '';
    let title;
    if (event.mode === 'active') title = 'Сейчас';
    else if (isOtherDay) title = `Далее · ${DAYS_SHORT[event.day] || ''}`;
    else title = 'Далее';

    const progress = event.total > 0 ? (event.elapsed / event.total) : 0;
    const bounce = settings.heartAnimation === 'bounce';
    const detail = formatProgressDetail(event);
    const key = `${settings.timerStyle}|${event.type}|${event.mode}|${event.subject}|${event.day}|${event.index}|${title}|${bounce}|${detail}`;

    if (home.dataset.key !== key) {
        let timerHtml;
        if (settings.timerStyle === 'bar') {
            const fillColor = event.type === 'lesson' ? 'var(--lesson-color)' : 'var(--break-color)';
            timerHtml = `
                <div class="status-bar">
                    <div class="status-bar-top">
                        <span class="status-bar-time">${timeStr}</span>
                        <span class="status-bar-label">${event.label}${detail ? ` · <span class="status-detail-inline">${detail}</span>` : ''}</span>
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
                const cls = heartClass(i < filled, fillClass, bounce);
                hearts += `<svg class="${cls}" style="--i:${i}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="${HEART_PATH}"/></svg>`;
            }
            timerHtml = `
                <div class="status-hearts">
                    <div class="status-hearts-time">${timeStr}</div>
                    <div class="hearts-row">${hearts}</div>
                    <div class="status-hearts-label">${event.label}${detail ? ` · ${detail}` : ''}</div>
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
                ${detail && settings.timerStyle !== 'hearts' ? `<span class="status-detail-inline">· ${detail}</span>` : ''}
            </div>
        `;
        home.dataset.key = key;

        // Плавная смена блока
        home.classList.remove('animating');
        void home.offsetWidth;
        home.classList.add('animating');
        setTimeout(() => home.classList.remove('animating'), 300);
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
                icon.setAttribute('class', heartClass(i < filled, fillClass, bounce));
            });
        }
    }

    updateTitle(timeStr, event);
    maybeNotify(event);
}

/* === Тикающий заголовок вкладки === */
function updateTitle(timeStr, event) {
    const t = timeStr ? `${timeStr} · Расписание` : 'Расписание';
    if (t !== lastTitleStr) {
        document.title = t;
        lastTitleStr = t;
    }
}

/* === Уведомления === */
let lastNotifiedKey = null;

function maybeNotify(event) {
    if (!settings.notificationsEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!event || event.mode !== 'active' || event.type !== 'lesson') return;

    const key = `${event.day}|${event.index}|${event.subject}`;
    if (key === lastNotifiedKey) return;
    lastNotifiedKey = key;

    try {
        new Notification('Урок начался', {
            body: event.subject,
            tag: 'lesson-start',
            silent: false
        });
    } catch (e) {}
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
        a.classList.remove('today');
        if (a.dataset.day === day) a.classList.add('active');
        if (a.dataset.day === currentActualDay) a.classList.add('today');
    });

    const bells = getBellsForDay(day);
    const lessons = getLessonsForDay(day);

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

/* === Тик === */
function tick() {
    if (document.hidden) return;

    const now = new Date();
    const today = DAYS_EN[now.getDay()];
    if (currentActualDay !== today) {
        currentActualDay = today;
        if (!manualDaySelection) {
            selectedDay = getSchoolDay(today);
            writeHash(selectedDay);
        }
    }

    tickCounter++;
    if (tickCounter >= 15) {
        tickCounter = 0;
        renderSchedule(selectedDay);
    }

    renderStatus();
}

function startStatusInterval() {
    if (statusInterval) return;
    statusInterval = setInterval(tick, 1000);
    tick();
}

function stopStatusInterval() {
    if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
    }
}

/* === Выбор дня === */
function selectDay(day, manual) {
    if (!DAYS_ORDER.includes(day)) return;
    selectedDay = day;
    manualDaySelection = (manual !== false) && (day !== getSchoolDay(currentActualDay));
    writeHash(day);
    renderSchedule(day);
    renderStatus();
}

/* === Свайпы === */
function initSwipe() {
    let startX = 0, startY = 0, moved = false;

    document.addEventListener('touchstart', e => {
        if (e.target.closest('.settings-panel') || e.target.closest('.settings-overlay')) return;
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (moved) return;
        if (e.touches.length !== 1) return;
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 10 || dy > 10) moved = true;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        if (!moved) return;
        if (e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 60) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.5) return;

        const idx = DAYS_ORDER.indexOf(selectedDay);
        if (idx < 0) return;
        const nextIdx = dx < 0 ? idx + 1 : idx - 1;
        if (nextIdx < 0 || nextIdx >= DAYS_ORDER.length) return;
        selectDay(DAYS_ORDER[nextIdx], true);
    }, { passive: true });
}

/* === Клавиатура === */
function initKeyboard() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('settings-panel');
            if (panel && panel.classList.contains('open')) {
                panel.classList.remove('open');
                document.getElementById('settings-overlay').classList.remove('open');
                return;
            }
        }
        if (e.target.matches('input, textarea, select')) return;
        if (e.key === 'ArrowLeft') {
            const idx = DAYS_ORDER.indexOf(selectedDay);
            if (idx > 0) selectDay(DAYS_ORDER[idx - 1], true);
        } else if (e.key === 'ArrowRight') {
            const idx = DAYS_ORDER.indexOf(selectedDay);
            if (idx >= 0 && idx < DAYS_ORDER.length - 1) selectDay(DAYS_ORDER[idx + 1], true);
        }
    });
}

/* === Загрузка расписания с кешем === */
async function loadSchedule() {
    const CACHE_KEY = 'schedule-cache-v1';
    const badge = document.getElementById('offline-badge');
    try {
        const r = await fetch('schedule.json', { cache: 'no-cache' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        if (badge) badge.hidden = true;
        return data;
    } catch (e) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                console.warn('Используем кеш расписания:', e.message);
                if (badge) badge.hidden = false;
                return JSON.parse(cached);
            }
        } catch (e2) {}
        throw e;
    }
}

/* === Инициализация === */
async function init() {
    particlesInit();
    loadSettings();
    applySettings();
    initSettingsUI();
    initSwipe();
    initKeyboard();

    if (SYSTEM_THEME_MQL.addEventListener) {
        SYSTEM_THEME_MQL.addEventListener('change', (e) => {
            if (localStorage.getItem('theme-explicit') === '1') return;
            settings.theme = e.matches ? 'dark' : 'light';
            applySettings();
            saveSettings();
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopStatusInterval();
        } else {
            startStatusInterval();
            renderSchedule(selectedDay);
            renderStatus();
        }
    });

    window.addEventListener('hashchange', () => {
        const h = readHashDay();
        if (h && h !== selectedDay) selectDay(h, true);
    });

    try {
        scheduleData = await loadSchedule();

        const now = new Date();
        currentActualDay = DAYS_EN[now.getDay()];
        const autoDay = getSchoolDay(currentActualDay);

        const hashDay = readHashDay();
        selectedDay = hashDay || autoDay;
        manualDaySelection = selectedDay !== autoDay;

        renderSchedule(selectedDay);
        renderStatus();
        startStatusInterval();

        document.querySelectorAll('nav ul li a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const day = link.dataset.day || link.getAttribute('href').substring(1);
                selectDay(day, true);
            });
        });

        const title = document.getElementById('header-title');
        if (title) {
            title.addEventListener('click', () => selectDay(getSchoolDay(currentActualDay), false));
            title.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectDay(getSchoolDay(currentActualDay), false);
                }
            });
        }

    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        document.querySelector('#home').innerHTML =
            '<h2 class="section-title">Сейчас</h2><p class="status-text-only">Ошибка загрузки данных. Проверьте, запущен ли локальный сервер.</p>';
    }
}

window.addEventListener('DOMContentLoaded', init);