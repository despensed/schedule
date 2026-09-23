export const DAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DAYS_RU = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница'
};

export const DAYS_SHORT = {
    monday: 'Пн',
    tuesday: 'Вт',
    wednesday: 'Ср',
    thursday: 'Чт',
    friday: 'Пт'
};

export const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export const STORAGE_KEYS = {
    SETTINGS: 'app-settings',
    THEME: 'theme',
    THEME_EXPLICIT: 'theme-explicit',
    SCHEDULE_CACHE: 'schedule-cache-v1'
};

export const DEFAULT_SETTINGS = {
    theme: 'light',
    customThemeColor: '#1e1b4b',
    customBaseTheme: 'light',
    timerStyle: 'ring',
    accentColor: '#6366f1',
    lessonColor: '#6366f1',
    breakColor: '#f59e0b',
    backgroundMode: 'orbs',
    orbsColors: ['#a5b4fc', '#f0abfc', '#93c5fd'],
    particlesCount: 5,
    particlesShape: 'dot',
    particlesBlur: 0,
    particlesColors: ['#6366f1'],
    gradientColor1: '#a5b4fc',
    gradientColor2: '#f0abfc',
    gradientAngle: 135,
    glowIntensity: 0,
    heartOutlineColor: '#6366f1',
    heartOutlineCustom: false,
    heartOutlineWidth: 1.5,
    heartAnimation: 'none',
    notificationsEnabled: false
};

export const VALID = {
    theme: ['light', 'dark', 'custom'],
    timerStyle: ['ring', 'bar', 'hearts', 'clock'],
    backgroundMode: ['orbs', 'particles', 'gradient', 'none'],
    particlesShape: ['dot', 'heart', 'triangle', 'random'],
    heartAnimation: ['none', 'bounce'],
    customBaseTheme: ['light', 'dark']
};

export const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export const ICON_PATHS = {
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    bookClosed: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
    sigma: '<path d="M18 4H6l6 8-6 8h12"/>',
    triangle: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
    chart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    atom: '<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    flask: '<path d="M9 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 8V2"/><line x1="9" y1="2" x2="15" y2="2"/><line x1="6" y1="15" x2="18" y2="15"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
    message: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'
};

export const SUBJECT_ICON_MAP = {
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