/**
 * @fileoverview Компонент выбора обложки для видеофайла
 *
 * Встроенный блок без диалога — поле URL и кнопка открытия MediaManager.
 * Поддерживает два способа хранения обложки: FK на media_files или прямой URL.
 *
 * @module media/thumbnail-selector
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { useMediaFiles, useSetThumbnail } from "../hooks/use-media";
import { MediaManager } from "./media-manager";
import type { MediaFile } from "@shared/schema";

/** Пропсы компонента ThumbnailSelector */
export interface ThumbnailSelectorProps {
  /** ID видеофайла для которого выбирается обложка */
  videoFileId: number;
  /** ID текущей обложки (null если нет) */
  currentThumbnailId: number | null;
  /** URL текущей обложки (из FK на media_files) */
  currentThumbnailUrl?: string | null;
  /** Прямой URL обложки (альтернатива currentThumbnailUrl из FK) */
  currentThumbnailDirectUrl?: string | null;
  /** ID проекта для загрузки фото */
  projectId: number;
  /** Callback после успешного сохранения */
  onSaved?: () => void;
}

/**
 * Встроенный блок выбора обложки видео
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ThumbnailSelector({
  videoFileId,
  currentThumbnailId,
  currentThumbnailUrl,
  currentThumbnailDirectUrl,
  projectId,
  onSaved,
}: ThumbnailSelectorProps) {
  /** Флаг открытия MediaManager */
  const [isOpen, setIsOpen] = useState(false);
  /** URL из поля ввода */
  const [urlInput, setUrlInput] = useState("");

  const { data: allFiles } = useMediaFiles(projectId);
  const setThumbnail = useSetThumbnail();

  /** URL для превью: сначала из FK, затем прямой URL */
  const previewUrl = currentThumbnailUrl || currentThumbnailDirectUrl;
  /** Показывать кнопку «Убрать» если есть хоть что-то */
  const hasThumbnail = !!(currentThumbnailId || currentThumbnailDirectUrl);

  /**
   * Устанавливает обложку по объекту MediaFile
   * @param file - Выбранный медиафайл
   */
  const handleSelectFile = async (file: MediaFile) => {
    await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: file.id, thumbnailUrl: null });
    setIsOpen(false);
    onSaved?.();
  };

  /**
   * Применяет обложку по введённому URL.
   * Если URL уже есть в БД — используем FK.
   * Иначе — сохраняем URL напрямую без скачивания.
   */
  const handleApplyUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    // Сначала ищем уже существующую запись в БД по URL
    const found = allFiles?.find((f) => f.url === trimmed);
    if (found) {
      // Файл уже в библиотеке — используем FK
      await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: found.id, thumbnailUrl: null });
      setUrlInput("");
      onSaved?.();
      return;
    }

    // Внешний URL или /uploads/ не в БД — сохраняем как строку напрямую
    await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: null, thumbnailUrl: trimmed });
    setUrlInput("");
    onSaved?.();
  };

  /**
   * Убирает обложку (сбрасывает и FK и прямой URL)
   */
  const handleRemove = async () => {
    await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: null, thumbnailUrl: null });
    onSaved?.();
  };

  return (
    <div className="mt-2 space-y-2 border-t border-slate-200/40 dark:border-slate-700/40 pt-2">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">🖼 Обложка видео</span>
        {hasThumbnail && (
          <button
            onClick={handleRemove}
            disabled={setThumbnail.isPending}
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            Убрать
          </button>
        )}
      </div>

      {/* Превью текущей обложки */}
      {previewUrl && (
        <div className="relative w-full rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
          <img
            src={previewUrl}
            alt="обложка"
            className="w-full h-20 object-cover"
          />
          <button
            onClick={handleRemove}
            disabled={setThumbnail.isPending}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Поле ввода URL */}
      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="URL фото обложки"
          className="h-8 text-xs flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleApplyUrl()}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleApplyUrl}
          disabled={!urlInput.trim() || setThumbnail.isPending}
          className="h-8 px-2 text-xs shrink-0"
        >
          ОК
        </Button>
      </div>

      {/* Кнопка открытия MediaManager */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="w-full h-8 text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            <Upload className="w-3 h-3 mr-1.5" />
            Выбрать или загрузить фото
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              <i className="fas fa-image mr-2 text-blue-600"></i>
              Выбор обложки видео
            </DialogTitle>
          </DialogHeader>
          <MediaManager
            projectId={projectId}
            selectedType="photo"
            onSelectFile={handleSelectFile}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
