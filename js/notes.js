import { toIso } from './overrides.js';
import { schoolNow } from './utils.js';

/** Заметки к урокам: хранятся в localStorage по ключу «дата|номер урока», прошедшие даты чистятся. */
const KEY = 'lesson-notes-v1';
let notes = {};
try { notes = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { notes = {}; }
const today = toIso(schoolNow());
Object.keys(notes).forEach(k => { if (k.split('|')[0] < today) delete notes[k]; });

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) { /* хранилище недоступно */ } };

export const getNote = (date, i) => notes[`${date}|${i}`] || '';

export function initNotes(rerender) {
    document.addEventListener('click', e => {
        const btn = e.target.closest('.note-btn');
        const li = btn && btn.closest('li');
        if (!li || li.querySelector('.note-input')) return;
        const key = `${li.dataset.date}|${li.dataset.i}`;
        li.querySelector('.lesson-note')?.remove();
        const input = document.createElement('input');
        input.className = 'note-input';
        input.maxLength = 120;
        input.placeholder = 'Заметка к уроку…';
        input.value = notes[key] || '';
        li.appendChild(input);
        input.focus();
        input.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') input.blur();
            if (ev.key === 'Escape') { input.dataset.cancel = '1'; input.blur(); }
        });
        input.addEventListener('blur', () => {
            if (!input.dataset.cancel) {
                const v = input.value.trim();
                if (v) notes[key] = v; else delete notes[key];
                save();
            }
            rerender();
        });
    });
}
