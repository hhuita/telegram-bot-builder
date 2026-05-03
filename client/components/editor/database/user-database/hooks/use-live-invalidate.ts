/**
 * @fileoverview Хук real-time инвалидации кэша при новых сообщениях.
 * При событии new-message обновляет статистику и список пользователей.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserMessagesLiveContext } from '../contexts/user-messages-live-context';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

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
 * Хук real-time инвалидации кэша при получении новых сообщений.
 * Подписывается на события WebSocket-контекста и с дебаунсом 2 секунды
 * инвалидирует статистику и первую страницу infinite query пользователей.
 * @param params - Параметры хука
 * @returns void
 */
export function useLiveInvalidate({ projectId, selectedTokenId }: UseLiveInvalidateParams): void {
  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    if (!liveContext) return;

    // Дебаунс — не инвалидировать чаще чем раз в 2 секунды
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = liveContext.subscribe(() => {
      if (timer) return; // уже запланировано
      timer = setTimeout(() => {
        timer = null;

        // Инвалидируем статистику
        const statsUrl = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, selectedTokenId);
        queryClient.invalidateQueries({ queryKey: [statsUrl, selectedTokenId] });

        // Инвалидируем infinite query пользователей (перезагрузит первую страницу)
        queryClient.invalidateQueries({ queryKey: ['infinite-users', projectId, selectedTokenId] });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [projectId, selectedTokenId, queryClient, liveContext]);
}
