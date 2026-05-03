/**
 * @fileoverview Компонент выбора обложки для видеофайла
 *
 * Встроенный блок без диалога — поле URL и кнопка открытия MediaManager.
 * Аналогичен MultiMediaSelector, но ограничен одним фото.
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
import { uploadImageFromUrl } from "@lib/bot-generator/media/uploadImageFromUrl";
import { toast } from "@/hooks/use-toast";
import type { MediaFile } from "@shared/schema";

/** Пропсы компонента ThumbnailSelector */
export interface ThumbnailSelectorProps {
  /** ID видеофайла для которого выбирается обложка */
  videoFileId: number;
  /** ID текущей обложки (null если нет) */
  currentThumbnailId: number | null;
  /** URL текущей обложки для превью */
  currentThumbnailUrl?: string | null;
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
  projectId,
  onSaved,
}: ThumbnailSelectorProps) {
  /** Флаг открытия MediaManager */
  const [isOpen, setIsOpen] = useState(false);
  /** URL из поля ввода */
  const [urlInput, setUrlInput] = useState("");

  /** Флаг загрузки по URL */
  const [isUploading, setIsUploading] = useState(false);

  const { data: allFiles } = useMediaFiles(projectId);
  const setThumbnail = useSetThumbnail();

  /**
   * Устанавливает обложку по объекту MediaFile
   * @param file - Выбранный медиафайл
   */
  const handleSelectFile = async (file: MediaFile) => {
    await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: file.id });
    setIsOpen(false);
    onSaved?.();
  };

  /**
   * Применяет обложку по введённому URL.
   * Если URL уже есть в БД — берём запись напрямую.
   * Если внешний https:// — скачиваем на сервер через uploadImageFromUrl,
   * затем ищем созданную запись по localPath.
   */
  const handleApplyUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    // Сначала ищем уже существующую запись
    const found = allFiles?.find((f) => f.url === trimmed);
    if (found) {
      await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: found.id });
      setUrlInput("");
      onSaved?.();
      return;
    }

    // Внешний URL — скачиваем на сервер
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      setIsUploading(true);
      try {
        const result = await uploadImageFromUrl(trimmed, projectId, 'thumbnail');
        if (result.success) {
          const localPath = result.localPath || result.imageUrl || trimmed;
          // Ищем созданную запись по localPath
          const uploaded = allFiles?.find((f) => f.url === localPath);
          if (uploaded) {
            await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: uploaded.id });
            toast({ title: 'Обложка загружена', description: result.message });
          } else {
            toast({ title: 'Обложка загружена', description: 'Обновите страницу если превью не появилось' });
          }
          setUrlInput("");
          onSaved?.();
        } else {
          toast({ title: 'Ошибка', description: 'Не удалось загрузить фото по URL', variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Ошибка', description: 'Не удалось загрузить фото по URL', variant: 'destructive' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  /**
   * Убирает обложку
   */
  const handleRemove = async () => {
    await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: null });
    onSaved?.();
  };

  return (
    <div className="mt-2 space-y-2 border-t border-slate-200/40 dark:border-slate-700/40 pt-2">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">🖼 Обложка видео</span>
        {currentThumbnailId && (
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
      {currentThumbnailUrl && (
        <div className="relative w-full rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
          <img
            src={currentThumbnailUrl}
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
        <div className="flex-1 relative">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="URL фото обложки"
            className="h-8 text-xs"
            disabled={isUploading}
            onKeyDown={(e) => e.key === "Enter" && handleApplyUrl()}
          />
          {isUploading && (
            <i className="fas fa-spinner fa-spin absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-xs"></i>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleApplyUrl}
          disabled={!urlInput.trim() || setThumbnail.isPending || isUploading}
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
