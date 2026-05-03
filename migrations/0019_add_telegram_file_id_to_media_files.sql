-- Добавление поля telegram_file_id в таблицу media_files
-- Хранит кэшированный Telegram file_id для быстрой повторной отправки медиафайлов
-- без повторной загрузки через URL или FSInputFile

ALTER TABLE media_files
ADD COLUMN IF NOT EXISTS telegram_file_id TEXT;
