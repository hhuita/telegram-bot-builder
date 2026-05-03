/**
 * @fileoverview Хук валидации обложки видео по требованиям Telegram API
 * @module media/use-thumbnail-validation
 */

/** Результат валидации обложки */
export interface ThumbnailValidationResult {
  /** Валидна ли обложка */
  valid: boolean;
  /** Список предупреждений (не блокируют, но Telegram может проигнорировать) */
  warnings: string[];
  /** Список ошибок (блокируют применение) */
  errors: string[];
}

/**
 * Валидирует URL обложки по требованиям Telegram API.
 * Проверяет формат по расширению URL.
 * @param url - URL обложки
 * @returns Результат валидации
 */
export function validateThumbnailUrl(url: string): ThumbnailValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const lower = url.toLowerCase();
  const isJpeg = lower.endsWith('.jpg') || lower.endsWith('.jpeg');
  if (!isJpeg) {
    warnings.push('Telegram рекомендует JPEG формат для обложки');
  }

  return { valid: errors.length === 0, warnings, errors };
}

/**
 * Валидирует файл обложки по размеру и разрешению через браузерный Image API.
 * @param file - Файл обложки
 * @returns Promise с результатом валидации
 */
export async function validateThumbnailFile(file: File): Promise<ThumbnailValidationResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Проверка формата
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    warnings.push('Telegram рекомендует JPEG формат для обложки');
  }

  // Проверка размера файла (200 KB = 204800 байт)
  if (file.size > 204800) {
    errors.push(`Размер обложки ${Math.round(file.size / 1024)} KB превышает лимит 200 KB`);
  }

  // Проверка разрешения через Image
  await new Promise<void>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width > 320 || img.height > 320) {
        warnings.push(`Разрешение ${img.width}×${img.height} px превышает рекомендуемые 320×320 px`);
      }
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    img.src = url;
  });

  return { valid: errors.length === 0, warnings, errors };
}
