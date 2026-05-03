-- Добавляем поле thumbnail_media_id — ссылка на фото-обложку видео
ALTER TABLE media_files 
ADD COLUMN IF NOT EXISTS thumbnail_media_id integer REFERENCES media_files(id) ON DELETE SET NULL;
