/**
 * @fileoverview Хук real-time обновления статистики и списка пользователей.
 * При событии new-message мгновенно обновляет кэш (optimistic update),
 * затем сразу синхронизирует данные с PostgreSQL без задержки.
 */

import { useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useUserMessagesLiveContext, NewMessageLiveEvent } from '../contexts/user-messages-live-context';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { UserStats } from '../types';
import { UserBotData } from '@shared/schema';

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
 * Структура страницы пользователей в кэше infinite-users
 */
interface UsersPageResponse {
  /** Список пользователей на странице */
  users: UserBotData[];
  /** Общее количество пользователей */
  total: number;
  /** Есть ли ещё страницы */
  hasMore: boolean;
}

/**
 * Мгновенно обновляет lastInteraction и interactionCount пользователя в кэше infinite-users.
 * @param queryClient - Клиент React Query
 * @param projectId - Идентификатор проекта
 * @param normalizedTokenId - Нормализованный идентификатор токена (null если не выбран)
 * @param userId - Идентификатор пользователя из WS-события
 */
function updateUserInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number,
  normalizedTokenId: number | null,
  userId: string,
): void {
  const now = new Date();
  queryClient.setQueriesData<InfiniteData<UsersPageResponse>>(
    { queryKey: ['infinite-users', projectId, normalizedTokenId] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          users: page.users.map((user) => {
            if (String(user.userId) !== String(userId)) return user;
            return {
              ...user,
              lastInteraction: now,
              interactionCount: (user.interactionCount ?? 0) + 1,
            };
          }),
        })),
      };
    },
  );
}

/**
 * Хук real-time обновления статистики и списка пользователей.
 * При каждом new-message:
 *   - мгновенно инкрементирует totalInteractions в кэше статистики
 *   - мгновенно обновляет lastInteraction и interactionCount пользователя в таблице
 *   - сразу инвалидирует кэш для синхронизации с PostgreSQL (без дебаунса)
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
    // Нормализуем selectedTokenId: undefined → null, чтобы совпасть с queryKey в useInfiniteUsers
    const normalizedTokenId = selectedTokenId ?? null;

    const unsubscribe = liveContext.subscribe((event: NewMessageLiveEvent) => {
      const userId = event.data?.userId;

      // Мгновенный optimistic update статистики — инкрементируем totalInteractions и пересчитываем среднее
      queryClient.setQueryData<UserStats>(statsKey, (old) => {
        const newTotal = (old?.totalInteractions ?? 0) + 1;
        const users = old?.totalUsers ?? 1;
        return {
          ...(old ?? {}),
          totalInteractions: newTotal,
          avgInteractionsPerUser: Math.round((newTotal / users) * 100) / 100,
        };
      });

      // Мгновенный optimistic update таблицы — обновляем lastInteraction и interactionCount
      if (userId) {
        updateUserInCache(queryClient, projectId, normalizedTokenId, userId);
      }

      // Сразу инвалидируем кэш — React Query сделает фоновый refetch
      queryClient.invalidateQueries({ queryKey: statsKey });
      queryClient.invalidateQueries({ queryKey: ['infinite-users', projectId, normalizedTokenId] });
    });

    return () => {
      unsubscribe();
    };
  }, [projectId, selectedTokenId, queryClient, liveContext]);
}
