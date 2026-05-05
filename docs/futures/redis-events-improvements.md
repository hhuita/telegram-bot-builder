# Redis Events — Улучшения

## Текущее состояние

| Канал | Когда | Данные |
|-------|-------|--------|
| `bot:message:{pid}:{tid}` | Каждое сообщение | userId, messageType, messageText, messageData, nodeId, id, createdAt |
| `bot:user:{pid}:{tid}` | Только первый визит | userId, username, firstName, lastName, avatarUrl, isBot, isPremium, languageCode, deepLinkParam, referrerId, registeredAt |
| `bot:logs:{pid}:{tid}` | Каждая строка лога | level, message, timestamp |
| `bot:started:{pid}:{tid}` | Запуск бота | projectId, tokenId, timestamp |
| `bot:stopped:{pid}:{tid}` | Остановка бота | projectId, tokenId, timestamp |

---

## Улучшения

### 🔴 Баги (Priority: High)

#### 1. `bot:message` не содержит `tokenId` в payload

**Проблема:** При нескольких ботах в одном проекте нельзя понять от какого бота пришло сообщение.
`tokenId` есть в названии канала (`bot:message:{pid}:{tid}`), но не в самом JSON.

**Решение:** Добавить `tokenId` в payload `save-message-to-api.py.jinja2`:
```python
_redis_payload = json.dumps({
    "tokenId": TOKEN_ID,   # ← добавить
    "userId": str(user_id),
    ...
})
```

**Файл:** `lib/templates/middleware/save-message-to-api.py.jinja2`

---

#### 2. `bot:user` не содержит `tokenId` в payload

**Проблема:** Та же проблема — `tokenId` есть в канале, но не в JSON.

**Решение:** Уже частично исправлено в Этапе 1 (`tokenId` добавлен в payload).
Проверить что `tokenId: TOKEN_ID` присутствует в `database.py.jinja2`.

**Файл:** `lib/templates/database/database.py.jinja2`

---

### 🟡 Новые события (Priority: Medium)

#### 3. Событие `bot:user:updated` — изменение данных пользователя

**Проблема:** Когда пользователь меняет username или имя в Telegram, данные в БД обновляются
при следующем визите, но UI не узнаёт об этом без полного refetch.

**Решение:** В `save_user_to_db` после UPDATE проверять изменились ли данные через `RETURNING`:

```sql
ON CONFLICT (user_id, project_id, token_id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    ...
RETURNING xmax,
    (bot_users.username IS DISTINCT FROM EXCLUDED.username) as username_changed,
    (bot_users.first_name IS DISTINCT FROM EXCLUDED.first_name) as name_changed
```

Если `username_changed OR name_changed` — публиковать:
```python
await _redis_client.publish(
    f"bot:user:updated:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "user-updated",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "username": username,
        "firstName": first_name,
        "lastName": last_name,
        "avatarUrl": avatar_url,
    })
)
```

**Файл:** `lib/templates/database/database.py.jinja2`

**Фронт:** Добавить обработку `user-updated` в `UserMessagesLiveContext` и `useLiveInvalidate`
— обновлять строку пользователя в таблице без полного refetch.

---

#### 4. Событие `bot:variable:changed` — изменение переменной пользователя

**Проблема:** Когда бот меняет переменную через `set_user_var`, UI не знает.
Полезно для live-обновления деталей пользователя в панели.

**Решение:** В `set_user_var` после записи публиковать:
```python
await _redis_client.publish(
    f"bot:variable:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "variable-changed",
        "userId": str(user_id),
        "tokenId": TOKEN_ID,
        "variableName": variable_name,
        "variableValue": variable_value,
    })
)
```

**Файл:** `lib/templates/utils/utils.py.jinja2`

**Осторожно:** `set_user_var` вызывается очень часто — нужно фильтровать
только "важные" переменные или добавить флаг `publishToRedis=True`.

---

### 🟢 Использование существующих событий (Priority: Low)

#### 5. `bot:started/stopped` не слушаются на фронте

**Проблема:** События есть, но UI их игнорирует. Статус бота обновляется только через поллинг.

**Решение:** Добавить подписку на `bot:started` и `bot:stopped` в `UserMessagesLiveContext`
или в отдельный хук `useBotStatusLive`. При получении события — обновлять статус бота
в карточке без перезагрузки страницы.

**Файлы:**
- `client/components/editor/database/user-database/contexts/user-messages-live-context.tsx`
- `client/components/editor/bot/hooks/use-bot-project-events.ts` (возможно уже есть)

---

#### 6. Нет события `bot:error`

**Проблема:** Критические ошибки бота не доходят до UI. Только через логи.

**Решение:** В `error-handler` шаблоне публиковать:
```python
await _redis_client.publish(
    f"bot:error:{PROJECT_ID}:{TOKEN_ID}",
    json.dumps({
        "type": "error",
        "message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
    })
)
```

**Файл:** `lib/templates/error-handler/` (если есть)

---

## Приоритизация

### Сделать сейчас:
1. ✅ Добавить `tokenId` в `bot:message` payload (баг, 1 строка)
2. ✅ Событие `bot:user:updated` (полезно для live UI)

### Потом:
3. `bot:started/stopped` на фронте (статус бота в реальном времени)
4. `bot:variable:changed` (осторожно с нагрузкой)
5. `bot:error` (для мониторинга)

---

## Файлы для изменения

**Шаблоны:**
```
lib/templates/middleware/save-message-to-api.py.jinja2  ← tokenId в payload
lib/templates/database/database.py.jinja2               ← bot:user:updated
lib/templates/utils/utils.py.jinja2                     ← bot:variable:changed (опционально)
```

**Фронт:**
```
client/components/editor/database/user-database/contexts/user-messages-live-context.tsx
client/components/editor/database/user-database/hooks/use-live-invalidate.ts
```
