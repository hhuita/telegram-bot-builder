/**
 * @fileoverview Числовая карточка статистики со sparkline-графиком
 * @description Отображает числовое значение, дельту и мини-график прироста
 */

import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
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
 * Числовая карточка статистики со sparkline и дельтой
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки
 */
export function StatMetricCard(props: StatMetricCardProps): React.JSX.Element {
  const { title, value, subtitle, trend, sparklineData, formatValue } = props;
  const fmt = formatValue ?? defaultFormat;
  const displayValue = value !== undefined ? fmt(value) : '—';
  // Если одна точка — дублируем чтобы recharts мог нарисовать линию
  const chartData = sparklineData && sparklineData.length === 1
    ? [sparklineData[0], sparklineData[0]]
    : sparklineData;
  const hasSparkline = chartData && chartData.length >= 2;

  return (
    <div className="bg-background border rounded-xl p-3 flex flex-col gap-2 min-w-0">
      {/* Заголовок */}
      <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>

      {/* Значение и sparkline */}
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
          {displayValue}
        </span>

        {hasSparkline && (
          <div className="w-20 h-10 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  fill="url(#sparkGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
