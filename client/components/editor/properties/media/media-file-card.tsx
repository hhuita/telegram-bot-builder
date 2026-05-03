/**
 * @fileoverview Карточка медиафайла
 *
 * Отображает информацию о файле с кнопками просмотра и удаления.
 * Поддерживает переменные вида {var.path} — показывает иконку вместо img.
 * Показывает кэшированный Telegram file_id если он есть.
 * Для видео — отображает блок выбора обложки.
 *
 * @module MediaFileCard
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, X, Copy, Check } from "lucide-react";
import { ThumbnailSelector } from "./thumbnail-selector";

/**
 * Проверяет, является ли строка переменной вида {var.path}
 * @param url - Строка для проверки
 * @returns true если строка является переменной-плейсхолдером
 */
function isVariablePlaceholder(url: string): boolean {
  return url.startsWith('{') && url.endsWith('}');
}

/** Пропсы компонента MediaFileCard */
export interface MediaFileCardProps {
  /** URL файла */
  url: string;
  /** Имя файла */
  fileName: string;
  /** Тип файла */
  fileType: string;
  /** Описание файла */
  description?: string;
  /** Теги файла */
  tags?: string[];
  /** Кэшированный Telegram file_id (появляется после первой отправки ботом) */
  telegramFileId?: string | null;
  /** Callback для предпросмотра */
  onPreview?: () => void;
  /** Callback для удаления */
  onRemove?: () => void;
  /** Флаг скрытого файла */
  isHidden?: boolean;
  /** ID видеофайла в БД (нужен для установки обложки) */
  mediaFileId?: number;
  /** ID текущей обложки */
  thumbnailMediaId?: number | null;
  /** URL текущей обложки */
  thumbnailUrl?: string | null;
  /** Прямой URL обложки (из поля thumbnailUrl, без FK) */
  thumbnailDirectUrl?: string | null;
  /** ID проекта (нужен для загрузки фото для выбора обложки) */
  projectId?: number;
}

/** Иконка для типа файла */
const FILE_ICONS: Record<string, string> = {
  image: '',
  photo: '',
  video: '🎥',
  audio: '🎵',
  document: '📄',
  sticker: '📌'
};

/**
 * Компонент карточки медиафайла
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function MediaFileCard({
  url,
  fileName,
  fileType,
  description,
  tags,
  telegramFileId,
  onPreview,
  onRemove,
  isHidden = false,
  mediaFileId,
  thumbnailMediaId,
  thumbnailUrl,
  thumbnailDirectUrl,
  projectId,
}: MediaFileCardProps) {
  /** Флаг успешного копирования file_id */
  const [copied, setCopied] = useState(false);

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else if (fileType === 'image' || fileType === 'photo') {
      window.open(url, '_blank');
    }
  };

  /**
   * Копирует Telegram file_id в буфер обмена
   */
  const handleCopyFileId = async () => {
    if (!telegramFileId) return;
    await navigator.clipboard.writeText(telegramFileId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border p-3 sm:p-4 ${
      isHidden 
        ? 'border-gray-300/60 dark:border-gray-700/60 bg-gradient-to-br from-gray-100/50 to-gray-50/30 dark:from-gray-900/30 dark:to-gray-800/20 opacity-60' 
        : 'border-emerald-200/60 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/30 dark:to-green-900/20'
    }`}>
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {fileType === 'image' || fileType === 'photo' ? (
            isVariablePlaceholder(url) ? (
              // Переменная — показываем иконку вместо img
              <span className="text-lg">🖼️</span>
            ) : (
              <img src={url} alt={fileName} className="w-full h-full object-cover" />
            )
          ) : fileType === 'video' ? (
            isVariablePlaceholder(url) ? (
              // Переменная — показываем иконку вместо video
              <span className="text-lg sm:text-xl">{FILE_ICONS.video}</span>
            ) : (
              // Превью видеофайла
              <video
                src={`${url}#t=0.1`}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
              />
            )
          ) : (
            <span className="text-lg sm:text-xl">{FILE_ICONS[fileType]}</span>
          )}
          {isHidden && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-xs text-white font-medium">Скрыт</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-xs sm:text-sm font-semibold truncate ${
              isHidden ? 'text-gray-700 dark:text-gray-300' : 'text-emerald-900 dark:text-emerald-100'
            }`}>{fileName}</p>
            {isHidden && (
              <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                Скрыт
              </Badge>
            )}
          </div>
          <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 truncate mt-0.5">{fileType.toUpperCase()}</p>
          <p className="text-xs text-emerald-600/50 dark:text-emerald-400/50 truncate mt-1">{url}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {fileType === 'image' && !isHidden && (
            <Button size="sm" variant="ghost" onClick={handlePreview} className="h-8 w-8 p-0">
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </Button>
          )}
          {onRemove && (
            <Button size="sm" variant="ghost" onClick={onRemove} className="h-8 w-8 p-0">
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Details */}
      {(description || tags?.length || telegramFileId !== undefined) && (
        <div className="mt-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-200/40 dark:border-slate-800/40">
          {description && (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <i className="fas fa-quote-left mr-2 text-slate-400"></i>
              {description}
            </p>
          )}
          {tags?.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs mr-1">
              <i className="fas fa-tag text-xs mr-1"></i>{tag}
            </Badge>
          ))}
          {/* Telegram File ID */}
          {telegramFileId !== undefined && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">🤖 File ID:</span>
              {telegramFileId ? (
                <>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate flex-1">
                    {telegramFileId}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyFileId}
                    className="h-5 w-5 p-0 shrink-0"
                    title="Скопировать File ID"
                  >
                    {copied
                      ? <Check className="w-3 h-3 text-emerald-500" />
                      : <Copy className="w-3 h-3 text-slate-400" />
                    }
                  </Button>
                </>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                  появится после первой отправки ботом
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Выбор обложки для видео */}
      {fileType === 'video' && mediaFileId && projectId && (
        <div className="mt-2">
          <ThumbnailSelector
            videoFileId={mediaFileId}
            currentThumbnailId={thumbnailMediaId ?? null}
            currentThumbnailUrl={thumbnailUrl}
            currentThumbnailDirectUrl={thumbnailDirectUrl}
            projectId={projectId}
          />
        </div>
      )}
    </div>
  );
}
