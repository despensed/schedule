/**
 * Ссылка на опубликованную Google Таблицу с заменами (формат CSV).
 *
 * Как получить: Файл → Поделиться → Опубликовать в интернете →
 * выбрать нужный лист и формат «CSV» → Опубликовать → скопировать ссылку.
 *
 * Пустая строка — замены отключены, сайт работает только по schedule.json.
 */
export const OVERRIDES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgx6lrfix8HLxdGOt-t5QWu0FPLANO_BLJlBS0pg86UANFArJEStrAohTMKmaXrks9CG_m2SJFeTYm/pub?gid=0&single=true&output=csv';

/** Сколько ждать таблицу, мс. Дольше — показываем обычное расписание. */
export const OVERRIDES_TIMEOUT_MS = 4000;
