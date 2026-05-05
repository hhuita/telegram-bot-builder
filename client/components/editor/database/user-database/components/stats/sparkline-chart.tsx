/**
 * @fileoverview Sparkline-график прироста пользователей
 * @description SVG-график с заливкой, направляющими, подписями осей и tooltip.
 *              Использует фиксированный viewBox для надёжного отображения линии.
 */

import React, { useState, useCallback } from 'react';
import { GrowthPoint } from '../../hooks/queries/use-growth';

/** Ширина внутреннего viewBox */
const VW = 400;
/** Высота внутреннего viewBox */
const VH = 80;
/** Отступ слева для подписей Y */
const PL = 28;
/** Отступ снизу для подписей X */
const PB = 16;
/** Отступ сверху */
const PT = 6;
/** Рабочая ширина графика */
const GW = VW - PL - 4;
/** Рабочая высота графика */
const GH = VH - PB - PT;

/**
 * Форматирует дату или datetime в короткий вид.
 * Если строка содержит время (ISO с T) — показывает "14:32", иначе "25 апр."
 * @param dateStr - Строка даты "YYYY-MM-DD" или ISO datetime
 * @returns Отформатированная строка
 */
function fmtDate(dateStr: string): string {
  if (dateStr.includes('T')) {
    // ISO datetime — показываем время
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }
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
  /** Цвет линии и градиента (по умолчанию #3b82f6 — синий) */
  lineColor?: string;
}

/**
 * Состояние tooltip при наведении
 */
interface TooltipState {
  /** Позиция X в пикселях относительно контейнера */
  x: number;
  /** Позиция Y в пикселях относительно контейнера */
  y: number;
  /** Ближайшая точка данных */
  point: GrowthPoint;
}

/**
 * Вычисляет X-координату точки в viewBox
 * @param i - Индекс точки
 * @param total - Общее количество точек
 * @returns X-координата в viewBox
 */
function calcX(i: number, total: number): number {
  return PL + (i / (total - 1)) * GW;
}

/**
 * Вычисляет Y-координату точки в viewBox с логарифмическим масштабированием
 * @param count - Значение точки
 * @param max - Максимальное значение в наборе
 * @returns Y-координата в viewBox
 */
function calcY(count: number, max: number): number {
  const scale = count > 0 ? Math.log1p(count) / Math.log1p(max) : 0;
  return PT + GH - scale * GH;
}

/**
 * Sparkline-график прироста пользователей
 * @param props - Свойства компонента
 * @returns SVG-график или null если данных недостаточно
 */
export function SparklineChart({ data, gradientId, lineColor = '#3b82f6' }: SparklineChartProps): React.JSX.Element | null {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.length;

  /** Строка точек для polyline */
  const linePoints = data.map((d, i) => `${calcX(i, total)},${calcY(d.count, max)}`).join(' ');

  /** Путь заливки под линией */
  const fillPath = [
    `M${calcX(0, total)},${PT + GH}`,
    `L${calcX(0, total)},${calcY(data[0].count, max)}`,
    ...data.slice(1).map((d, i) => `L${calcX(i + 1, total)},${calcY(d.count, max)}`),
    `L${calcX(total - 1, total)},${PT + GH}`,
    'Z',
  ].join(' ');

  const midIdx = Math.floor((total - 1) / 2);

  /** Обработчик движения мыши — находит ближайшую точку данных */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * VW;
      const ratio = Math.max(0, Math.min(1, (relX - PL) / GW));
      const idx = Math.round(ratio * (total - 1));
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        point: data[idx],
      });
    },
    [data, total],
  );

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="80"
        style={{ display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Горизонтальные направляющие */}
        <line x1={PL} y1={PT} x2={VW - 4} y2={PT} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <line x1={PL} y1={PT + GH / 2} x2={VW - 4} y2={PT + GH / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <line x1={PL} y1={PT + GH} x2={VW - 4} y2={PT + GH} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* Заливка под линией */}
        <path d={fillPath} fill={`url(#${gradientId})`} />

        {/* Линия графика — цвет задаётся через проп lineColor */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Подписи по оси Y */}
        <text x={PL - 3} y={PT + 6} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
          {max}
        </text>
        <text x={PL - 3} y={PT + GH} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
          0
        </text>

        {/* Подписи по оси X */}
        <text x={PL} y={VH - 2} fontSize="9" fill="rgba(255,255,255,0.4)">
          {fmtDate(data[0].date)}
        </text>
        <text x={calcX(midIdx, total)} y={VH - 2} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="middle">
          {fmtDate(data[midIdx].date)}
        </text>
        <text x={VW - 4} y={VH - 2} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
          {fmtDate(data[total - 1].date)}
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
