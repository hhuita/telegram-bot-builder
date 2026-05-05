# Charts Roadmap — Графики аналитики

## Текущее состояние

| График | Статус | Данные |
|--------|--------|--------|
| Прирост пользователей (sparkline) | ✅ готов | `bot_users.registered_at` |
| Источники трафика (бары) | ✅ готов | `bot_users.deep_link_param` |
| Языки (бары) | ✅ готов | `bot_users.language_code` |
| Статус пользователей (бары) | ✅ готов | `bot_users.is_active/is_premium` |

---

## Переключатель гранулярности (TradingView-стиль)

Единый переключатель для всех временных графиков:

```
[1м] [5м] [1ч] [1д] [1н] [1М] [Всё]
```

| Режим | Агрегация | Точек | Для чего |
|-------|-----------|-------|----------|
| `1м` | по минутам | 60 | live мониторинг сообщений |
| `5м` | по 5 минут | 288 | активность за сутки |
| `1ч` | по часам | 24-168 | активность за день/неделю |
| `1д` | по дням | 30-90 | текущий месяц/квартал |
| `1н` | по неделям | 12-52 | годовой тренд |
| `1М` | по месяцам | 12-36 | долгосрочный тренд |
| `Всё` | по месяцам | все данные | с начала работы бота |

**Важно:** секунды имеют смысл только для `bot_messages` (сообщений в секунду), не для регистраций.

**Реализация:**
- Параметр `granularity` в API: `1m|5m|1h|1d|1w|1M|all`
- SQL: `DATE_TRUNC('hour', created_at)` / `DATE_TRUNC('day', ...)` и т.д.
- Фронт: переключатель в карточке, сохранять выбор в localStorage

---

## Линейные графики (Line / Area)

### ✅ Прирост пользователей
Уже реализован. Новых пользователей за период.

### ⏳ Сообщений в день
```sql
SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
FROM bot_messages
WHERE project_id = $1 AND token_id = $2
GROUP BY date ORDER BY date
```
Показывает активность переписки. Можно разделить на входящие (user) и исходящие (bot).

### ⏳ Активных пользователей в день (DAU)
```sql
SELECT DATE_TRUNC('day', created_at) as date, COUNT(DISTINCT user_id) as count
FROM bot_messages
WHERE project_id = $1
GROUP BY date ORDER BY date
```
Уникальные пользователи написавшие хотя бы одно сообщение за день.

### ⏳ Retention curve
```
100% │●
 80% │  ●
 60% │     ●
 40% │        ●
 20% │           ●
  0% └──────────────
     д1  д7  д14 д30
```
Процент пользователей вернувшихся через N дней после регистрации.
Требует сравнения `registered_at` с датами последующих сообщений.

---

## Столбчатые графики (Bar Chart)

### ⏳ Активность по часам суток
```sql
SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
FROM bot_messages WHERE project_id = $1
GROUP BY hour ORDER BY hour
```
Показывает в какое время суток пользователи наиболее активны.
Полезно для выбора времени рассылок.

```
Сообщений
 200 │              ████
 150 │         ████ ████ ████
 100 │    ████ ████ ████ ████ ████
  50 │    ████ ████ ████ ████ ████ ████
   0 └────────────────────────────────
     00  03  06  09  12  15  18  21
```

### ⏳ Активность по дням недели
```sql
SELECT EXTRACT(DOW FROM created_at) as dow, COUNT(*) as count
FROM bot_messages WHERE project_id = $1
GROUP BY dow ORDER BY dow
```
Пн/Вт/Ср... — где пик активности.

### ⏳ Топ узлов по посещениям
Требует `bot:node:visited` Redis события и таблицы `bot_events`.
```
msg-welcome    ████████████████████  856
msg-menu       ████████████████      634
msg-promo      ████████████          412
```

### ⏳ Топ кнопок по нажатиям
Требует `bot:button:clicked` Redis события.

---

## Воронка (Funnel Chart)

### ⏳ Конверсия по сценарию
Требует `bot_events` с `node_visit`.
```
Зашли в бота     102  ████████████████████  100%
Нажали кнопку     89  ██████████████████     87%
Ответили          67  █████████████          66%
Дошли до конца    45  █████████              44%
```

### ⏳ Drop-off по узлам
Где пользователи выходят из сценария. Показывается прямо в редакторе — узлы подсвечены цветом.

---

## Heatmap

### ⏳ Активность часы × дни недели
Матрица 7×24 как у GitHub contributions.
```
       Пн  Вт  Ср  Чт  Пт  Сб  Вс
00:00  ░░  ░░  ░░  ░░  ░░  ░░  ░░
06:00  ▒▒  ▒▒  ▒▒  ▒▒  ▒▒  ░░  ░░
12:00  ██  ██  ██  ██  ██  ▓▓  ▓▓
18:00  ██  ██  ██  ██  ██  ██  ██
```

### ⏳ Карта сценария с тепловой окраской
Узлы в редакторе подсвечены по количеству посещений:
- 🟢 Зелёный — много посещений
- 🟡 Жёлтый — среднее
- 🔴 Красный — высокий drop-off

---

## Специальные

### ⏳ Cohort retention таблица
```
Когорта    │ Д1   │ Д7   │ Д14  │ Д30
───────────┼──────┼──────┼──────┼──────
Апрель     │ 100% │  45% │  28% │  15%
Март       │ 100% │  52% │  31% │  18%
Февраль    │ 100% │  48% │  29% │  16%
```

### ⏳ Среднее время ответа бота
```sql
-- Время между сообщением пользователя и ответом бота
SELECT AVG(bot_time - user_time) as avg_response_time
FROM (
  SELECT user_msg.created_at as user_time,
         MIN(bot_msg.created_at) as bot_time
  FROM bot_messages user_msg
  JOIN bot_messages bot_msg ON bot_msg.user_id = user_msg.user_id
    AND bot_msg.message_type = 'bot'
    AND bot_msg.created_at > user_msg.created_at
  WHERE user_msg.message_type = 'user'
  GROUP BY user_msg.id, user_msg.created_at
) t
```

---

## Приоритизация

### Сделать сейчас (данные уже есть):
1. **Переключатель гранулярности** на sparkline (7д/30д/90д/всё)
2. **Сообщений в день** — второй sparkline в карточке "Активность"
3. **Активность по часам** — bar chart, данные из `bot_messages`
4. **Сглаживание линии** — кривые Безье вместо polyline

### После добавления `bot_events`:
5. Топ узлов по посещениям
6. Воронка конверсии
7. Карта сценария с тепловой окраской

### Долгосрочно:
8. Retention curve
9. Cohort retention таблица
10. Heatmap активности
11. Среднее время ответа бота

---

## Компоненты для реализации

```
client/components/editor/database/user-database/components/stats/
  sparkline-chart.tsx          ✅ готов
  bar-chart.tsx                ← новый: столбчатый график
  funnel-chart.tsx             ← новый: воронка
  heatmap-chart.tsx            ← новый: тепловая карта
  retention-chart.tsx          ← новый: retention curve

client/components/editor/database/user-database/hooks/queries/
  use-growth.ts                ✅ готов
  use-messages-activity.ts     ← новый: сообщений в день
  use-hourly-activity.ts       ← новый: активность по часам
  use-retention.ts             ← новый: retention данные
```
