/**
 * @fileoverview Компонент секции статистики с трафиком
 * @description Отображает карточки статистики и секцию трафика/языков
 */

import React from 'react';
import { StatsCards, TrafficSection } from '../components/stats';
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

  if (!stats) {
    return null;
  }

  return (
    <>
      <StatsCards stats={stats} />
      {projectId != null && (
        <TrafficSection
          projectId={projectId}
          selectedTokenId={selectedTokenId}
          stats={stats}
          onSourceClick={onSourceClick}
        />
      )}
    </>
  );
}
