/**
 * @fileoverview Главный дашборд статистики пользователей
 * @description Сетка из числовых карточек и карточек с барами
 */

import React from 'react';
import { UserStats } from '../../types';
import { useGrowth } from '../../hooks/queries/use-growth';
import { useTraffic } from '../../hooks/queries/use-traffic';
import { StatMetricCard } from './stat-metric-card';
import { StatBarCard } from './stat-bar-card';

/**
 * Пропсы компонента StatsDashboard
 */
export interface StatsDashboardProps {
  /** Статистика пользователей */
  stats: UserStats;
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Обработчик клика по источнику трафика */
  onSourceClick?: (source: string) => void;
}

/**
 * Форматирует среднее значение взаимодействий
 * @param v - Числовое значение
 * @returns Строка с одним знаком после запятой
 */
function formatAvg(v: number): string {
  return v.toFixed(1);
}

/**
 * Главный дашборд статистики: числовые карточки + бары источников и языков
 * @param props - Пропсы компонента
 * @returns JSX элемент дашборда
 */
export function StatsDashboard(props: StatsDashboardProps): React.JSX.Element {
  const { stats, projectId, selectedTokenId, onSourceClick } = props;

  const { points, weeklyGrowth } = useGrowth({ projectId, selectedTokenId });
  const { sources, languages } = useTraffic({ projectId, selectedTokenId });

  // Определяем тренд по недельному приросту
  const growthTrend = weeklyGrowth > 0 ? 'up' : weeklyGrowth < 0 ? 'down' : 'neutral';

  // Преобразуем источники трафика в формат StatBarItem
  const sourceItems = sources.map(s => ({
    label: s.param,
    count: s.count,
    percentage: s.percentage,
  }));

  // Преобразуем языки в формат StatBarItem
  const languageItems = languages.map(l => ({
    label: l.code,
    count: l.count,
    percentage: l.percentage,
  }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 p-3 grid-cols-1-mobile">
      {/* Карточка: всего пользователей со sparkline */}
      <StatMetricCard
        title="Всего пользователей"
        value={stats.totalUsers}
        sparklineData={points}
        trend={growthTrend}
        subtitle={weeklyGrowth > 0 ? `+${weeklyGrowth} за неделю` : undefined}
      />

      {/* Карточка: активность */}
      <StatMetricCard
        title="Активность"
        value={stats.totalInteractions}
        subtitle={
          stats.avgInteractionsPerUser !== undefined
            ? `${formatAvg(stats.avgInteractionsPerUser)} / юзер`
            : undefined
        }
        trend="neutral"
      />

      {/* Карточка: источники трафика (только если есть данные) */}
      {sourceItems.length > 0 && (
        <StatBarCard
          title="Источники трафика"
          items={sourceItems}
          onItemClick={onSourceClick}
        />
      )}

      {/* Карточка: языки (только если есть данные) */}
      {languageItems.length > 0 && (
        <StatBarCard
          title="Языки"
          items={languageItems}
        />
      )}
    </div>
  );
}
