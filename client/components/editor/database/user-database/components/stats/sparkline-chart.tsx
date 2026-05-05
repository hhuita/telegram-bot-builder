/**
 * @fileoverview Адаптивный sparkline-график в стиле Railway
 * @description SVG-график с заливкой, направляющими, подписями осей и tooltip.
 *              Реализован без внешних зависимостей через нативный SVG.
 */

import React, { useState, useCallback } from 'react';
import { GrowthPoint } from '../../hooks/queries/use-growth';

/** Ширина внутреннего viewBox */
const W = 300;
/** Высота внутреннего viewBox */
const H = 56;
/** Отступ слева для подписей Y */
const PAD_LEFT = 22;
/** Отступ снизу для подписей X */
const PAD_BOTTOM = 14;
/** Рабочая ширина графика */
const GW = W - PAD_LEFT;
/** Рабочая высота графика */
const GH = H - PAD_BOTTOM - 4;

/**
 * Форматирует дату в короткий вид "25 апр"
 * @param dateStr - Строка даты "YYYY-MM-DD"
 * @returns Отформатированная строка
 */
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Пропсы компонента SparklineChart
 */
export interface SparklineChartProps {
  /** Массив точек прироста */
  data: GrowthPoint[];
  /** Уникальный суффикс для id градиента */
  gradientId: string;
}

/**
 * Состояние tooltip при наведении
 */
interface TooltipState {
  /** Позиция X в пикселях (относительно SVG) */
  x: number;
  /** Позиция Y в пикселях */
  y: number;
  /** Ближайшая точка данных */
  point: GrowthPoint;
}

/**
 * Адаптивный sparkline-график в стиле Railway
 * @param props - Пропсы компонента
 * @returns SVG-график или null если данных недостаточно
 */
export function SparklineChart({ data, gradientId }: SparklineChartProps): React.JSX.Element | null {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map(d => d.count), 1);
  // Логарифмическое масштабирование — сглаживает пики и делает малые значения видимыми
  const logScale = (v: number) => v > 0 ? Math.log1p(v) / Math.log1p(max) : 0;

  /** Вычисляет X-координату точки в viewBox */
  const px = (i: number) => PAD_LEFT + (i / (data.length - 1)) * GW;
  /** Вычисляет Y-координату точки в viewBox */
  const py = (count: number) => 4 + GH - logScale(count) * GH;

  const linePoints = data.map((d, i) => `${px(i)},${py(d.count)}`).join(' ');

  const firstPt = `${px(0)},${py(data[0].count)}`;
  const lastPt = `${px(data.length - 1)},${py(data[data.length - 1].count)}`;
  const fillPath = `M${px(0)},${4 + GH} L${firstPt} ${data
    .slice(1)
    .map((d, i) => `L${px(i + 1)},${py(d.count)}`)
    .join(' ')} L${px(data.length - 1)},${4 + GH} Z`;

  const midIdx = Math.floor((data.length - 1) / 2);
  const midY = py(max / 2);

  /** Обработчик движения мыши — находит ближайшую точку */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * W;
      const chartX = relX - PAD_LEFT;
      const ratio = Math.max(0, Math.min(1, chartX / GW));
      const idx = Math.round(ratio * (data.length - 1));
      const pt = data[idx];
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, point: pt });
    },
    [data],
  );

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: '64px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Горизонтальные направляющие */}
        <line x1={PAD_LEFT} y1={4} x2={W} y2={4} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
        <line x1={PAD_LEFT} y1={midY} x2={W} y2={midY} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
        <line x1={PAD_LEFT} y1={4 + GH} x2={W} y2={4 + GH} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />

        {/* Заливка под линией */}
        <path d={fillPath} fill={`url(#${gradientId})`} />

        {/* Линия графика */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Подписи по Y */}
        <text x={PAD_LEFT - 2} y={10} fontSize="8" fill="currentColor" opacity="0.4" textAnchor="end">
          {max}
        </text>
        <text x={PAD_LEFT - 2} y={4 + GH} fontSize="8" fill="currentColor" opacity="0.4" textAnchor="end">
          0
        </text>

        {/* Подписи по X */}
        <text x={PAD_LEFT} y={H - 1} fontSize="8" fill="currentColor" opacity="0.4">
          {fmtDate(data[0].date)}
        </text>
        <text x={px(midIdx)} y={H - 1} fontSize="8" fill="currentColor" opacity="0.4" textAnchor="middle">
          {fmtDate(data[midIdx].date)}
        </text>
        <text x={W} y={H - 1} fontSize="8" fill="currentColor" opacity="0.4" textAnchor="end">
          {fmtDate(data[data.length - 1].date)}
        </text>
      </svg>

      {/* Tooltip при наведении */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{ left: tooltip.x + 8, top: Math.max(0, tooltip.y - 32) }}
        >
          <span className="opacity-60">{fmtDate(tooltip.point.date)}</span>
          <span className="ml-2 font-semibold">{tooltip.point.count}</span>
        </div>
      )}
    </div>
  );
}
