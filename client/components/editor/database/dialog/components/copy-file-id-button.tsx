/**
 * @fileoverview Кнопка копирования Telegram file_id медиафайла.
 * Появляется при наведении на медиа-контейнер, копирует file_id в буфер обмена.
 */

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Свойства кнопки копирования file_id
 */
interface CopyFileIdButtonProps {
  /** Telegram file_id для копирования */
  fileId: string;
  /** Дополнительные CSS классы для позиционирования */
  className?: string;
}

/**
 * Кнопка копирования Telegram file_id.
 * Показывает иконку Copy, при клике копирует file_id и на 2 сек показывает галочку.
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки
 */
export function CopyFileIdButton({ fileId, className = '' }: CopyFileIdButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  /**
   * Копирует file_id в буфер обмена
   * @param e - Событие клика (останавливаем всплытие чтобы не открывался lightbox)
   */
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fileId).then(() => {
      setCopied(true);
      toast({ description: 'file_id скопирован' });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({ description: 'Не удалось скопировать', variant: 'destructive' });
    });
  }, [fileId, toast]);

  return (
    <button
      onClick={handleCopy}
      title="Скопировать file_id"
      className={`flex items-center justify-center w-6 h-6 rounded bg-black/50 hover:bg-black/70 text-white transition-colors ${className}`}
    >
      {copied
        ? <Check className="w-3 h-3" />
        : <Copy className="w-3 h-3" />
      }
    </button>
  );
}
