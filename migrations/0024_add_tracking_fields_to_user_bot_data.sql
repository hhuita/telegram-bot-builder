-- @fileoverview Миграция: добавление полей трекинга в таблицу user_bot_data
-- Синхронизирует user_bot_data с bot_users — добавляет deep_link_param и referrer_id
-- Created: 2026-05-05

ALTER TABLE user_bot_data ADD COLUMN IF NOT EXISTS deep_link_param text;
ALTER TABLE user_bot_data ADD COLUMN IF NOT EXISTS referrer_id text;
