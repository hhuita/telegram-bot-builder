/**
 * @fileoverview Хук для загрузки данных активности сообщений по дням
 * @description Получает ежедневное количество сообщений через GET /api/projects/:id/messages/activity
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { GrowthPoint } from './use-growth';

/**
 * Параметры хука useMessagesActivity
 */
interface UseMessagesActivityParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Период: "7d" | "30d" | "90d", по умолчанию "30d" */
  period?: '7d' | '30d' | '90d';
}

/**
 * Вычисляет сумму сообщений за последние 7 дней из массива точек
 * @param points - Массив точек активности
 * @returns Суммарное количество сообщений за 7 дней
 */
function calcWeeklyMessages(points: GrowthPoint[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return points
    .filter(p => new Date(p.date) >= cutoff)
    .reduce((sum, p) => sum + p.count, 0);
}

/**
 * Хук для загрузки данных активности сообщений по дням
 * @param params - Параметры хука
 * @returns Точки активности, недельное количество сообщений и состояние загрузки
 */
export function useMessagesActivity(params: UseMessagesActivityParams) {
  const { projectId, selectedTokenId, period = '30d' } = params;

  const baseUrl = `/api/projects/${projectId}/messages/activity?period=${period}`;
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<GrowthPoint[]>({
    queryKey: [requestUrl, selectedTokenId, period],
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const points = data ?? [];

  return {
    /** Массив точек активности сообщений по дням */
    points,
    /** Суммарное количество сообщений за последние 7 дней */
    weeklyMessages: calcWeeklyMessages(points),
    /** Флаг загрузки данных */
    isLoading,
  };
}
