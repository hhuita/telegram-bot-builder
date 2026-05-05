/**
 * @fileoverview Числовая карточка статистики со sparkline-графиком
 * @description Отображает числовое значение, дельту и мини-график прироста.
 *              Sparkline реализован через нативный SVG без зависимостей.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GrowthPoint } from '../../hooks/queries/use-growth';

/**
 * Пропсы компонента StatMetricCard
 */
export interface StatMetricCardProps {
  /** Заголовок карточки */
  title: string;
  /** Числовое значение для отображения */
  value: number | undefined;
  /** Подпись под значением, например "+5 за неделю" */
  subtitle?: string;
  /** Направление тренда */
  trend?: 'up' | 'down' | 'neutral';
  /** Данные для sparkline-графика */
  sparklineData?: GrowthPoint[];
  /** Функция форматирования значения */
  formatValue?: (v: number) => string;
}

/**
 * Форматирует число для компактного отображения
 * @param v - Числовое значение
 * @returns Отформатированная строка
 */
function defaultFormat(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  if (!Number.isInteger(v)) return v.toFixed(1);
  return String(v);
}

/**
 * Иконка тренда по направлению
 * @param trend - Направление тренда
 * @returns JSX иконка
 */
function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-rose-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

/**
 * SVG sparkline без внешних зависимостей
 * @param data - Массив точек прироста
 * @returns SVG элемент или null если данных недостаточно
 */
function Sparkline({ data }: { data: Array<{ count: number }> }) {
  if (!data || data.length < 2) return null;

  const width = 120;
  const height = 48;
  const max = Math.max(...data.map(d => d.count), 1);
  const min = Math.min(...data.map(d => d.count));
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.count - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  // Путь для заливки под линией
  const fillPath = `M0,${height} L${points.split(' ').map(p => {
    const [x, y] = p.split(',');
    return `${x},${y}`;
  }).join(' L')} L${width},${height} Z`;

  return (
    <svg width={width} height={height} className="flex-shrink-0 opacity-90">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#sg)" className="text-primary" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
}

/**
 * Числовая карточка статистики со sparkline и дельтой
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки
 */
export function StatMetricCard(props: StatMetricCardProps): React.JSX.Element {
  const { title, value, subtitle, trend, sparklineData, formatValue } = props;
  const fmt = formatValue ?? defaultFormat;
  const displayValue = value !== undefined ? fmt(value) : '—';

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-2 min-w-0">
      {/* Заголовок */}
      <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>

      {/* Значение и sparkline */}
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
          {displayValue}
        </span>
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline data={sparklineData} />
        )}
      </div>

      {/* Подпись с трендом */}
      {subtitle && (
        <div className="flex items-center gap-1">
          <TrendIcon trend={trend} />
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
      )}
    </div>
  );
}
