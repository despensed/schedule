#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import sys

TEMP_FILE = 'schedule_temp.json'
BASE_FILE = 'schedule.json'

schedule_days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница']
day_keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

bell_modes_ru = ['Пн / Чт (8 уроков)', 'Вт - Пт (7 уроков)']
bell_modes_keys = ['monday', 'tuesday_friday']


# --- файлы ---

def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        return json.loads(text) if text else {}
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def clear_file(path):
    with open(path, 'w', encoding='utf-8') as f:
        f.write('{}\n')


# --- утилиты ---

def default_mode(day_key):
    return 'monday' if day_key in ('monday', 'thursday') else 'tuesday_friday'


def bell_count(mode):
    bells = load_json(BASE_FILE).get('bells', {}).get(mode, [])
    return len(bells) if bells else (8 if mode == 'monday' else 7)


def base_lessons(day_key):
    return list(load_json(BASE_FILE).get('days', {}).get(day_key, []))


def normalize(lessons, mode):
    n = bell_count(mode)
    lessons = list(lessons)
    while len(lessons) < n:
        lessons.append('')
    return lessons[:n]


def ask(prompt):
    return input(prompt).strip()


def confirm(prompt):
    a = ask(prompt + ' [y/N]: ').lower()
    return a in ('y', 'yes', 'д', 'да')


# --- меню ---

def menu_days():
    print()
    print('Выбери один из следующих дней:')
    visual_number = 1
    for d in schedule_days:
        print(f'{visual_number} > {d}')
        visual_number += 1
    while True:
        try:
            n = int(ask('> '))
            if 1 <= n <= 5:
                return day_keys[n - 1]
        except ValueError:
            pass
        print('Число от 1 до 5.')


def menu_bells(current=None):
    print()
    print('Тип звонков:')
    visual_number = 1
    for m in bell_modes_ru:
        mark = '  <-- текущий' if bell_modes_keys[visual_number - 1] == current else ''
        print(f'{visual_number} > {m}{mark}')
        visual_number += 1
    while True:
        try:
            n = int(ask('> '))
            if 1 <= n <= 2:
                return bell_modes_keys[n - 1]
        except ValueError:
            pass
        print('1 или 2.')


def menu_lessons(day_key, mode, lessons):
    lessons = normalize(lessons, mode)
    count = bell_count(mode)

    while True:
        print()
        print(f'Уроки на {schedule_days[day_keys.index(day_key)]}:')
        visual_number = 1
        for s in lessons:
            print(f'{visual_number} > {s or "(пусто)"}')
            visual_number += 1
        print()
        print('  0              > назад')
        print('  N              > изменить урок N')
        print('  m<N> <M>       > поменять уроки N и M (пример: m2 5)')
        print('  d<N>           > удалить урок N')
        print('  a              > добавить пустой урок')
        print('  c              > очистить всё')
        print('  z              > взять из базового расписания')

        raw = ask('> ').lower()

        if raw in ('', '0'):
            return lessons

        if raw == 'a':
            if len(lessons) < count:
                lessons.append('')
            else:
                print(f'Уже максимум — {count}.')
            continue

        if raw == 'c':
            if confirm('Очистить все уроки?'):
                lessons = [''] * count
            continue

        if raw == 'z':
            if confirm('Заполнить из базового расписания?'):
                lessons = normalize(base_lessons(day_key), mode)
            continue

        if raw.startswith('m') and ' ' in raw:
            try:
                parts = raw[1:].split()
                a, b = int(parts[0]) - 1, int(parts[1]) - 1
                lessons[a], lessons[b] = lessons[b], lessons[a]
            except (ValueError, IndexError):
                print('Не понял. Пример: m2 5')
            continue

        if raw.startswith('d'):
            try:
                i = int(raw[1:]) - 1
                lessons.pop(i)
                lessons.append('')
            except (ValueError, IndexError):
                print('Не понял. Пример: d3')
            continue

        try:
            i = int(raw) - 1
            if 0 <= i < len(lessons):
                cur = lessons[i] or '(пусто)'
                lessons[i] = ask(f'Новое значение ({cur}): ').rstrip()
            else:
                print(f'Нет урока №{raw}.')
        except ValueError:
            print('Не понял команду.')


def show_state(data):
    print()
    print('-' * 44)
    if not data:
        print('  Файл пуст — временное расписание не задано.')
        print('-' * 44)
        return
    active = data.get('active', False)
    day = data.get('day')
    mode = data.get('bellsMode') or (default_mode(day) if day else None)
    lessons = data.get('lessons', [])
    print(f"  Активно: {'да' if active else 'нет'}")
    print(f"  День:    {schedule_days[day_keys.index(day)] if day in day_keys else '(не выбран)'}")
    if mode:
        idx = bell_modes_keys.index(mode) if mode in bell_modes_keys else 0
        print(f"  Звонки:  {bell_modes_ru[idx]}")
    print(f"  Уроков:  {len(lessons)}")
    if lessons:
        print('-' * 44)
        visual_number = 1
        for s in lessons:
            print(f"  {visual_number} > {s or '(пусто)'}")
            visual_number += 1
    print('-' * 44)


def menu_main(data):
    while True:
        show_state(data)
        active = data.get('active', False)

        print()
        print('Что делаем?')
        print(f"  1 > {'Выключить' if active else 'Включить'} временное расписание")
        print('  2 > Сменить день')
        print('  3 > Сменить тип звонков')
        print('  4 > Редактировать уроки')
        print('  5 > Заполнить из базового расписания')
        print('  6 > Очистить файл целиком')
        print('  s > Сохранить и выйти')
        print('  q > Выйти без сохранения')

        cmd = ask('> ').lower()

        if cmd == 's':
            if data:
                save_json(TEMP_FILE, data)
                print(f'\nСохранено в {TEMP_FILE}')
            else:
                clear_file(TEMP_FILE)
                print(f'\nФайл очищен: {TEMP_FILE}')
            return

        if cmd in ('q', ''):
            print('\nВыход без сохранения.')
            return

        if cmd == '1':
            if not data.get('day'):
                print('Сначала выбери день (пункт 2).')
                continue
            if not data.get('lessons'):
                print('Сначала добавь уроки (пункт 4 или 5).')
                continue
            data['active'] = not data.get('active', False)

        elif cmd == '2':
            new_day = menu_days()
            old_day = data.get('day')
            data['day'] = new_day
            if old_day and data.get('bellsMode') == default_mode(old_day):
                data['bellsMode'] = default_mode(new_day)
            elif not data.get('bellsMode'):
                data['bellsMode'] = default_mode(new_day)
            if data.get('lessons'):
                data['lessons'] = normalize(data['lessons'], data['bellsMode'])

        elif cmd == '3':
            if not data.get('day'):
                print('Сначала выбери день (пункт 2).')
                continue
            mode = menu_bells(data.get('bellsMode'))
            data['bellsMode'] = mode
            if data.get('lessons'):
                data['lessons'] = normalize(data['lessons'], mode)

        elif cmd == '4':
            if not data.get('day'):
                print('Сначала выбери день (пункт 2).')
                continue
            day = data['day']
            mode = data.get('bellsMode') or default_mode(day)
            data['bellsMode'] = mode
            lessons = data.get('lessons') or []
            if not lessons:
                if confirm('Заполнить из базового расписания?'):
                    lessons = base_lessons(day)
            data['lessons'] = menu_lessons(day, mode, lessons)

        elif cmd == '5':
            if not data.get('day'):
                print('Сначала выбери день (пункт 2).')
                continue
            day = data['day']
            mode = data.get('bellsMode') or default_mode(day)
            data['bellsMode'] = mode
            data['lessons'] = normalize(base_lessons(day), mode)
            print('Уроки заполнены из базового расписания.')

        elif cmd == '6':
            if confirm('Полностью очистить файл?'):
                data.clear()
                clear_file(TEMP_FILE)
                print('Файл очищен.')

        else:
            print('Не понял команду.')


def main():
    if not os.path.exists(BASE_FILE):
        print(f'[!] Нет файла {BASE_FILE} рядом со скриптом.')
        sys.exit(1)

    data = load_json(TEMP_FILE)

    if not data:
        print()
        print('Файл пуст. Создаём временное расписание.')
        day = menu_days()
        mode = default_mode(day)
        data = {
            'active': True,
            'day': day,
            'bellsMode': mode,
            'lessons': normalize(base_lessons(day), mode),
        }
        print(f'\nЧерновик на {schedule_days[day_keys.index(day)]} готов (заполнен из базового).')

    menu_main(data)


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print('\nПрервано.')
        sys.exit(1)
