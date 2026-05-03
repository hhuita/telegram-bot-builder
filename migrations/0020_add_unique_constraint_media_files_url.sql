-- @fileoverview Миграция: уникальный индекс (url, project_id) для media_files
-- Позволяет использовать INSERT ... ON CONFLICT для сохранения telegram_file_id
-- при первой отправке внешних URL (не загруженных через менеджер медиафайлов)

-- Удаляем дубли перед добавлением индекса (оставляем запись с наибольшим id)
DELETE FROM media_files
WHERE id NOT IN (
    SELECT MAX(id)
    FROM media_files
    GROUP BY url, project_id
);

-- Добавляем уникальный индекс если ещё не существует
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_files_url_project_id_unique'
    ) THEN
        ALTER TABLE media_files
        ADD CONSTRAINT media_files_url_project_id_unique UNIQUE (url, project_id);
    END IF;
END $$;
