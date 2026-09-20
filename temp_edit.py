#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Редактор временного расписания (schedule_temp.json).

Запуск:
    python temp_edit.py

Файл schedule_temp.json лежит рядом с этим скриптом.
Пока в нём active=true и указан день — сайт будет использовать
это расписание вместо обычного.
"""

import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_FILE = os.path.join(SCRIPT_DIR, 'schedule_temp.json')
BASE_FILE = os.path.join(SCRIPT_DIR, 'schedule.json')

DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
DAYS_RU = {
    'monday': 'понедельник',
    'tuesday': 'вторник',
    'wednesday': 'среда',
    'thursday': 'четверг',
    'friday': 'пятница',
}
DAYS_SHORT = {
    'monday': 'Пн',
    'tuesday': 'Вт',
    'wednesday': 'Ср',
    'thursday': 'Чт',
    'friday': 'Пт',
}
BELL_MODES = {
    'monday': 'Пн / Чт (8 уроков)',
    'tuesday_friday': 'Вт – Пт (7 уроков)',
}


# ---------- Файловые операции ----------

def load_temp():
    if not os.path.exists(TEMP_FILE):
        return {}
    try:
        with open(TEMP_FILE, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        if not text:
            return {}
        data = json.loads(text)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError as e:
        print(f'\n[!] Файл schedule_temp.json содержит ошибку JSON: {e}')
        print('    Начинаем с пустого состояния.')
        return {}
    except OSError as e:
        print(f'\n[!] Не удалось прочитать файл: {e}')
        return {}


def save_temp(data):
    with open(TEMP_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def clear_temp_file():
    with open(TEMP_FILE, 'w', encoding='utf-8') as f:
        f.write('{}\n')


def load_base():
    if not os.path.exists(BASE_FILE):
        return {}
    try:
        with open(BASE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


# ---------- Хелперы ----------

def default_bells_mode(day):
    return 'monday' if day in ('monday', 'thursday') else 'tuesday_friday'


def bell_count(day, mode=None):
    if mode is None:
        mode = default_bells_mode(day)
    base = load_base()
    bells = base.get('bells', {}).get(mode, [])
    if bells:
        return len(bells)
    return 8 if mode == 'monday' else 7


def base_lessons(day):
    base = load_base()
    return list(base.get('days', {}).get(day, []))


def normalize_lessons(lessons, day, mode):
    """Приводит длину списка уроков к количеству звонков."""
    n = bell_count(day, mode)
    lessons = list(lessons)
    while len(lessons) < n:
        lessons.append('')
    if len(lessons) > n:
        lessons = lessons[:n]
    return lessons


def ask_yes_no(prompt, default=False):
    suffix = ' [Y/n]: ' if default else ' [y/N]: '
    while True:
        ans = input(prompt + suffix).strip().lower()
        if not ans:
            return default
        if ans in ('y', 'yes', 'д', 'да'):
            return True
        if ans in ('n', 'no', 'н', 'нет'):
            return False


# ---------- Печать ----------

def print_header():
    print()
    print('=' * 54)
    print('  Редактор временного расписания')
    print(f'  Файл: {TEMP_FILE}')
    print('=' * 54)


def print_state(data):
    print()
    print('Текущее состояние:')
    if not data:
        print('  (пусто — временное расписание не задано)')
        return

    active = data.get('active', False)
    day = data.get('day')
    mode = data.get('bellsMode') or (default_bells_mode(day) if day else '')
    lessons = data.get('lessons', [])

    print(f"  Активно:  {'да' if active else 'нет'}")
    if day:
        print(f"  День:     {DAYS_RU.get(day, day)}")
    else:
        print('  День:     (не выбран)')
    if mode:
        print(f"  Звонки:   {BELL_MODES.get(mode, mode)}")
    print(f'  Уроков:   {len(lessons)}')

    if lessons:
        print()
        for i, s in enumerate(lessons, 1):
            print(f"    {i:2}. {s or '(пусто)'}")


# ---------- Выбор дня / звонков ----------

def pick_day(current=None):
    print()
    print('День недели:')
    for i, d in enumerate(DAY_ORDER, 1):
        mark = '  ← текущий' if d == current else ''
        print(f"  {i}. {DAYS_RU[d]}{mark}")
    while True:
        ans = input('Номер (1-5, Enter — отмена): ').strip()
        if not ans:
            return None
        try:
            n = int(ans)
            if 1 <= n <= 5:
                return DAY_ORDER[n - 1]
        except ValueError:
            pass
        print('Попробуйте ещё раз.')


def pick_bells_mode(current=None):
    print()
    print('Тип звонков:')
    print(f"  1. {BELL_MODES['monday']}"
          f"{'  ← текущий' if current == 'monday' else ''}")
    print(f"  2. {BELL_MODES['tuesday_friday']}"
          f"{'  ← текущий' if current == 'tuesday_friday' else ''}")
    while True:
        ans = input('Номер (1-2, Enter — отмена): ').strip()
        if not ans:
            return None
        if ans == '1':
            return 'monday'
        if ans == '2':
            return 'tuesday_friday'
        print('Попробуйте ещё раз.')


# ---------- Подредактор уроков ----------

def edit_lessons(day, lessons, mode):
    lessons = normalize_lessons(lessons, day, mode)
    max_n = len(lessons)

    while True:
        print()
        print(f"Уроки на {DAYS_RU[day]} (макс. {max_n}):")
        for i, s in enumerate(lessons, 1):
            print(f"  {i:2}. {s or '(пусто)'}")

        print()
        print('Команды:')
        print('  n <номер>       — изменить урок')
        print('  a               — добавить пустой урок')
        print('  d <номер>       — удалить урок (сдвигает остальные)')
        print('  m <a> <b>       — поменять уроки a и b местами')
        print('  c               — очистить все уроки')
        print('  z               — заполнить из базового расписания')
        print('  b               — назад')
        print('  Enter           — назад')

        raw = input('> ').strip()
        if raw == '' or raw == 'b':
            return lessons

        parts = raw.split()
        cmd = parts[0].lower()

        if cmd == 'n' and len(parts) >= 2:
            try:
                idx = int(parts[1]) - 1
                if 0 <= idx < len(lessons):
                    cur = lessons[idx] or 'пусто'
                    new_val = input(f'Новое значение ({cur}): ').rstrip()
                    lessons[idx] = new_val
                else:
                    print(f'Нет урока №{parts[1]}.')
            except ValueError:
                print('Нужен номер.')

        elif cmd == 'a':
            if len(lessons) >= max_n:
                print(f'Уже максимум — {max_n}.')
            else:
                lessons.append('')

        elif cmd == 'd' and len(parts) >= 2:
            try:
                idx = int(parts[1]) - 1
                if 0 <= idx < len(lessons):
                    del lessons[idx]
                    lessons.append('')
                else:
                    print(f'Нет урока №{parts[1]}.')
            except ValueError:
                print('Нужен номер.')

        elif cmd == 'm' and len(parts) >= 3:
            try:
                a = int(parts[1]) - 1
                b = int(parts[2]) - 1
                if 0 <= a < len(lessons) and 0 <= b < len(lessons):
                    lessons[a], lessons[b] = lessons[b], lessons[a]
                else:
                    print('Один из номеров вне диапазона.')
            except ValueError:
                print('Нужны номера.')

        elif cmd == 'c':
            if ask_yes_no('Очистить все уроки?'):
                lessons = [''] * max_n

        elif cmd == 'z':
            if ask_yes_no('Заполнить из базового расписания?', default=True):
                base = base_lessons(day)
                lessons = normalize_lessons(base, day, mode)

        else:
            print('Неизвестная команда.')


# ---------- Главное меню ----------

def run_menu(data):
    while True:
        print_header()
        print_state(data)

        print()
        print('Действия:')
        active = data.get('active', False)
        print(f"  1 — {'Выключить' if active else 'Включить'} временное расписание")
        print('  2 — Сменить день недели')
        print('  3 — Сменить тип звонков')
        print('  4 — Редактировать уроки')
        print('  5 — Заполнить уроки из базового расписания')
        print('  6 — Сбросить файл (сделать пустым)')
        print('  s — Сохранить и выйти')
        print('  q — Выйти без сохранения')

        cmd = input('> ').strip().lower()

        if cmd == 's':
            if data:
                save_temp(data)
                print(f'\nСохранено в {TEMP_FILE}')
            else:
                clear_temp_file()
                print(f'\nФайл очищен: {TEMP_FILE}')
            return

        if cmd == 'q' or cmd == '':
            print('\nВыход без сохранения.')
            return

        if cmd == '1':
            if not data.get('day'):
                print('\nСначала выберите день (пункт 2).')
                continue
            if not data.get('lessons'):
                print('\nСначала задайте уроки (пункт 4 или 5).')
                continue
            data['active'] = not data.get('active', False)

        elif cmd == '2':
            new_day = pick_day(data.get('day'))
            if new_day:
                old_day = data.get('day')
                data['day'] = new_day
                # если меняли день и раньше был автоподбор звонков — обновим
                if not data.get('bellsMode') or (
                    old_day and data['bellsMode'] == default_bells_mode(old_day)
                ):
                    data['bellsMode'] = default_bells_mode(new_day)
                # подгоняем длину уроков под новый режим звонков
                if data.get('lessons'):
                    data['lessons'] = normalize_lessons(
                        data['lessons'], new_day, data['bellsMode']
                    )

        elif cmd == '3':
            if not data.get('day'):
                print('\nСначала выберите день (пункт 2).')
                continue
            new_mode = pick_bells_mode(data.get('bellsMode'))
            if new_mode:
                data['bellsMode'] = new_mode
                if data.get('lessons'):
                    data['lessons'] = normalize_lessons(
                        data['lessons'], data['day'], new_mode
                    )

        elif cmd == '4':
            if not data.get('day'):
                print('\nСначала выберите день (пункт 2).')
                continue
            day = data['day']
            mode = data.get('bellsMode') or default_bells_mode(day)
            data['bellsMode'] = mode
            lessons = data.get('lessons') or []
            if not lessons:
                if ask_yes_no('Заполнить из базового расписания?', default=True):
                    lessons = base_lessons(day)
            data['lessons'] = edit_lessons(day, lessons, mode)

        elif cmd == '5':
            if not data.get('day'):
                print('\nСначала выберите день (пункт 2).')
                continue
            day = data['day']
            mode = data.get('bellsMode') or default_bells_mode(day)
            data['bellsMode'] = mode
            data['lessons'] = normalize_lessons(base_lessons(day), day, mode)
            print('\nУроки заполнены из базового расписания.')

        elif cmd == '6':
            if ask_yes_no('Полностью сбросить файл?'):
                data.clear()
                clear_temp_file()
                print('Файл очищен.')

        else:
            print('Неизвестная команда.')


# ---------- Точка входа ----------

def main():
    data = load_temp()

    # Быстрый старт, если файл пуст
    if not data:
        print_header()
        print()
        print('Файл пока пуст. Создаём временное расписание.')
        day = pick_day(None)
        if day is None:
            print('Отменено.')
            return

        mode = default_bells_mode(day)
        data = {
            'active': True,
            'day': day,
            'bellsMode': mode,
            'lessons': normalize_lessons(base_lessons(day), day, mode),
        }
        print(f'\nСоздан черновик на {DAYS_RU[day]}. Заполнено из базового расписания.')

    run_menu(data)


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print('\nПрервано.')
        sys.exit(1)
