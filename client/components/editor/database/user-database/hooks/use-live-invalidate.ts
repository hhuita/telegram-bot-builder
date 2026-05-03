/**
 * @fileoverview Хук real-time обновления статистики и списка пользователей.
 * При событии new-message мгновенно инкрементирует счётчики в кэше,
 * а через 2 секунды синхронизирует данные с PostgreSQL.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserMessagesLiveContext } from '../contexts/user-messages-live-context';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { UserStats } from '../types';

/**
 * Параметры хука useLiveInvalidate
 */
interface UseLiveInvalidateParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Хук real-time обновления статистики и списка пользователей.
 * При каждом new-message:
 *   - мгновенно инкрементирует totalInteractions в кэше (optimistic update)
 *   - с дебаунсом 2 сек синхронизирует статистику и список с PostgreSQL
 * @param params - Параметры хука
 * @returns void
 */
export function useLiveInvalidate({ projectId, selectedTokenId }: UseLiveInvalidateParams): void {
  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    if (!liveContext) return;

    const statsUrl = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, selectedTokenId);
    const statsKey = [statsUrl, selectedTokenId];

    /** Таймер дебаунса для синхронизации с БД */
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = liveContext.subscribe(() => {
      // Мгновенный optimistic update — инкрементируем totalInteractions в памяти
      queryClient.setQueryData<UserStats>(statsKey, (old) => ({
        ...(old ?? {}),
        totalInteractions: (old?.totalInteractions ?? 0) + 1,
      }));

      // Дебаунс — синхронизация с PostgreSQL не чаще раза в 2 секунды
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        // Перезапрашиваем актуальные данные из БД
        queryClient.invalidateQueries({ queryKey: statsKey });
        // Используем только ['infinite-users', projectId] без selectedTokenId —
        // null и undefined не равны при сравнении ключей React Query,
        // поэтому prefix-match по двум элементам покрывает все варианты токена
        queryClient.invalidateQueries({ queryKey: ['infinite-users', projectId] });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [projectId, selectedTokenId, queryClient, liveContext]);
}
