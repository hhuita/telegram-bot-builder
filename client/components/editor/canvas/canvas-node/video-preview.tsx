/**
 * @fileoverview Компонент превью видео с кнопкой воспроизведения
 *
 * Отображает видео с оверлеем-кнопкой Play/Pause по центру.
 * Клик по оверлею запускает или останавливает воспроизведение.
 *
 * @module canvas-node/video-preview
 */

import { useRef, useState } from 'react';

/** Пропсы компонента VideoPreview */
interface VideoPreviewProps {
  /** URL видеофайла */
  src: string;
  /** Дополнительные CSS-классы для обёртки */
  className?: string;
}

/**
 * Компонент превью видео с кнопкой воспроизведения/паузы
 *
 * Рендерит видео с полупрозрачным оверлеем. При клике переключает
 * воспроизведение. Кнопка скрывается во время воспроизведения.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент с видео и оверлеем
 */
export function VideoPreview({ src, className }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  /**
   * Переключает воспроизведение/паузу видео
   */
  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      void videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div
      className={`relative cursor-pointer${className ? ` ${className}` : ''}`}
      onClick={toggle}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto max-h-48 object-cover"
        muted
        preload="metadata"
        onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl ml-1">▶</span>
          </div>
        </div>
      )}
      {playing && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl">⏸</span>
          </div>
        </div>
      )}
    </div>
  );
}
