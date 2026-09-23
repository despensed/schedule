import { ICON_PATHS, SUBJECT_ICON_MAP } from './constants.js';

export function getSubjectIcon(subject) {
    const key = String(subject).toLowerCase().trim();
    const name = SUBJECT_ICON_MAP[key] || 'bookClosed';
    const path = ICON_PATHS[name] || '';
    return `<svg class="subject-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}