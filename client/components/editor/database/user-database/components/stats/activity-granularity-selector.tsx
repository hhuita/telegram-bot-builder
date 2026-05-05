/**
 * @fileoverview Компактный переключатель гранулярности для графика активности сообщений
 * @description Отображает кнопки [1м] [5м] [1ч] [1д] [7д] [30д], активная подсвечена
 */

import React from 'react';
import { Granularity } from '../../hooks/queries/use-messages-activity';

/**
 * Пропсы компонента ActivityGranularitySelector
 */
export interface ActivityGranularitySelectorProps {
  /** Текущее значение гранулярности */
  value: Granularity;
  /** Обработчик изменения гранулярности */
  onChange: (g: Granularity) => void;
}

/**
 * Метка кнопки для каждого значения гранулярности
 */
const GRANULARITY_LABELS: Record<Granularity, string> = {
  '1m':  '1м',
  '5m':  '5м',
  '1h':  '1ч',
  '1d':  '1д',
  '7d':  '7д',
  '30d': '30д',
};

/** Порядок отображения кнопок */
const GRANULARITY_ORDER: Granularity[] = ['1m', '5m', '1h', '1d', '7d', '30d'];

/**
 * Компактный переключатель гранулярности графика активности
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function ActivityGranularitySelector(
  props: ActivityGranularitySelectorProps,
): React.JSX.Element {
  const { value, onChange } = props;

  return (
    <div className="flex items-center gap-0.5">
      {GRANULARITY_ORDER.map((g) => {
        const isActive = g === value;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={[
              'text-xs px-1.5 py-0.5 rounded transition-colors',
              isActive
                ? 'bg-primary/20 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {GRANULARITY_LABELS[g]}
          </button>
        );
      })}
    </div>
  );
}
