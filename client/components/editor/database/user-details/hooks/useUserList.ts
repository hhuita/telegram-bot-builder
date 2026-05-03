/**
 * @fileoverview Хук загрузки списка пользователей
 * @description Загружает список пользователей проекта для навигации.
 * Использует limit=200 и staleTime чтобы переиспользовать кэш
 * и не дублировать запросы при открытии деталей/диалога.
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/**
 * Загружает список пользователей проекта для навигации
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns Список пользователей и состояние загрузки
 */
export function useUserList(
  projectId: number,
  selectedTokenId?: number | null
): { users: UserBotData[]; isLoading: boolean } {
  const requestUrl = buildUsersApiUrl(`/api/projects/${projectId}/users`, selectedTokenId, {
    limit: '200',
    offset: '0',
  });

  const { data, isLoading } = useQuery<{ users: UserBotData[] } | UserBotData[]>({
    queryKey: ['user-list', projectId, selectedTokenId],
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
    // Кэшируем на 30 секунд — список для навигации не требует частого обновления
    staleTime: 30_000,
    gcTime: 60_000,
    select: (data) => {
      // Пагинированный ответ: { users: [...], total, hasMore }
      if (data && typeof data === 'object' && !Array.isArray(data) && 'users' in data) {
        return data.users;
      }
      // Старый формат: массив
      return Array.isArray(data) ? data : [];
    },
  });

  return { users: (data as UserBotData[]) ?? [], isLoading };
}
