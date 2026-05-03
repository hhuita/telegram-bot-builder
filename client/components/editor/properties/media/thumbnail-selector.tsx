/**
 * @fileoverview Компонент выбора обложки для видеофайла
 * @module media/thumbnail-selector
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useMediaFiles } from "../hooks/use-media";
import { useSetThumbnail } from "../hooks/use-media";
import { ThumbnailLibraryTab } from "./thumbnail-library-tab";

/** Пропсы компонента ThumbnailSelector */
export interface ThumbnailSelectorProps {
  /** ID видеофайла для которого выбирается обложка */
  videoFileId: number;
  /** ID текущей обложки (null если нет) */
  currentThumbnailId: number | null;
  /** URL текущей обложки для превью */
  currentThumbnailUrl?: string | null;
  /** ID проекта для загрузки списка фото */
  projectId: number;
  /** Callback после успешного сохранения */
  onSaved?: () => void;
}

/**
 * Компонент выбора/смены обложки видео
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
  /** Флаг открытия диалога */
  const [open, setOpen] = useState(false);
  /** URL из поля ввода вкладки "По URL" */
  const [urlInput, setUrlInput] = useState("");

  const { data: photos, isLoading } = useMediaFiles(projectId, "photo");
  const setThumbnail = useSetThumbnail();

  /**
   * Устанавливает обложку по ID фото из библиотеки
   * @param thumbnailId - ID фото-обложки
   */
  const handleSelectFromLibrary = async (thumbnailId: number) => {
    await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId });
    setOpen(false);
    onSaved?.();
  };

  /**
   * Убирает обложку (устанавливает null)
   */
  const handleRemoveThumbnail = async () => {
    await setThumbnail.mutateAsync({ videoId: videoFileId, thumbnailId: null });
    onSaved?.();
  };

  /**
   * Применяет обложку по введённому URL
   * Ищет фото с таким URL в библиотеке проекта
   */
  const handleApplyUrl = async () => {
    if (!urlInput.trim()) return;
    const found = photos?.find((p) => p.url === urlInput.trim());
    if (found) {
      await handleSelectFromLibrary(found.id);
    }
    setUrlInput("");
  };

  return (
    <div className="flex items-center gap-2">
      {/* Кнопка-триггер с мини-превью или иконкой */}
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1.5"
        onClick={() => setOpen(true)}
      >
        {currentThumbnailUrl ? (
          <img
            src={currentThumbnailUrl}
            alt="обложка"
            className="w-4 h-4 rounded object-cover"
          />
        ) : (
          <span>🖼</span>
        )}
        Обложка
      </Button>

      {/* Кнопка удаления обложки */}
      {currentThumbnailId && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-red-500 hover:text-red-600 px-2"
          onClick={handleRemoveThumbnail}
          disabled={setThumbnail.isPending}
        >
          Убрать
        </Button>
      )}

      {/* Диалог выбора обложки */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Выбор обложки видео</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="library">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">Из библиотеки</TabsTrigger>
              <TabsTrigger value="url">По URL</TabsTrigger>
            </TabsList>

            {/* Вкладка: выбор из библиотеки фото проекта */}
            <TabsContent value="library" className="mt-3">
              <ThumbnailLibraryTab
                photos={photos ?? []}
                isLoading={isLoading}
                currentThumbnailId={currentThumbnailId}
                onSelect={handleSelectFromLibrary}
                isPending={setThumbnail.isPending}
              />
            </TabsContent>

            {/* Вкладка: ввод URL */}
            <TabsContent value="url" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Введите URL фото, уже загруженного в библиотеку проекта
              </p>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleApplyUrl()}
                />
                <Button
                  size="sm"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim() || setThumbnail.isPending}
                >
                  Применить
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
