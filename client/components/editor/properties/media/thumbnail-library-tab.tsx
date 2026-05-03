/**
 * @fileoverview Вкладка выбора обложки из библиотеки фото проекта
 * @module media/thumbnail-library-tab
 */

import type { MediaFile } from "@shared/schema";

/** Пропсы вкладки библиотеки обложек */
interface ThumbnailLibraryTabProps {
  /** Список фото проекта */
  photos: MediaFile[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** ID текущей выбранной обложки */
  currentThumbnailId: number | null;
  /** Callback при выборе фото */
  onSelect: (id: number) => void;
  /** Флаг ожидания мутации */
  isPending: boolean;
}

/**
 * Вкладка выбора обложки из библиотеки фото
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ThumbnailLibraryTab({
  photos,
  isLoading,
  currentThumbnailId,
  onSelect,
  isPending,
}: ThumbnailLibraryTabProps) {
  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        Загрузка фото...
      </p>
    );
  }

  if (!photos.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        В проекте нет загруженных фото
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
      {photos.map((photo) => {
        const isSelected = photo.id === currentThumbnailId;
        return (
          <button
            key={photo.id}
            onClick={() => onSelect(photo.id)}
            disabled={isPending}
            className={`
              relative rounded-lg overflow-hidden border-2 transition-all aspect-video
              ${isSelected
                ? "border-emerald-500 ring-2 ring-emerald-400/50"
                : "border-transparent hover:border-slate-400"
              }
            `}
            title={photo.fileName}
          >
            <img
              src={photo.url}
              alt={photo.fileName}
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-600 text-lg">✓</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
