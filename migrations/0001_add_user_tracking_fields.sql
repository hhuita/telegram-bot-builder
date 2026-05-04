-- @fileoverview Миграция: добавление полей трекинга пользователей в таблицу bot_users
-- Добавляет поля is_premium, is_bot, language_code, deep_link_param, referrer_id
-- Created: 2026-02-22

ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS is_premium integer DEFAULT 0;
ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS is_bot integer DEFAULT 0;
ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS language_code text;
ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS deep_link_param text;
ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS referrer_id text;
