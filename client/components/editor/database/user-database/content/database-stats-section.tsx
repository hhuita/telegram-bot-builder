/**
 * @fileoverview Компонент секции статистики с дашбордом
 * @description Отображает StatsDashboard если есть projectId, иначе fallback на StatsCards
 */

import React from 'react';
import { StatsCards, StatsDashboard } from '../components/stats';
import { UserStats } from '../types';

/**
 * Пропсы компонента DatabaseStatsSection
 */
interface DatabaseStatsSectionProps {
  /** Статистика пользователей */
  stats?: UserStats;
  /** Идентификатор проекта */
  projectId?: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Обработчик клика по источнику трафика */
  onSourceClick?: (source: string) => void;
}

/**
 * Компонент секции статистики
 * @param props - Пропсы компонента
 * @returns JSX компонент статистики или null
 */
export function DatabaseStatsSection(props: DatabaseStatsSectionProps): React.JSX.Element | null {
  const { stats, projectId, selectedTokenId, onSourceClick } = props;

  if (!stats) return null;

  // Без projectId используем старые карточки как fallback
  if (!projectId) {
    return <StatsCards stats={stats} />;
  }

  return (
    <StatsDashboard
      stats={stats}
      projectId={projectId}
      selectedTokenId={selectedTokenId}
      onSourceClick={onSourceClick}
    />
  );
}
