/**
 * @fileoverview Главный хук для загрузки данных базы пользователей
 * @description Агрегирует query-хуки с поддержкой серверного поиска, фильтрации и сортировки
 */

import { UseUserDatabaseParams, UseUserDatabaseReturn } from './types';
import { useProject } from './queries/use-project';
import { useInfiniteUsers } from './queries/use-infinite-users';
import { useStats } from './queries/use-stats';

/**
 * Хук для загрузки всех данных базы пользователей
 * @param params - Параметры хука
 * @returns Объект с данными и функциями обновления
 */
export function useUserDatabase(params: UseUserDatabaseParams): UseUserDatabaseReturn {
  const { projectId, selectedTokenId, searchQuery, filterActive, sortField, sortDirection } = params;

  const { project } = useProject({ projectId });
  const {
    allUsers: users,
    isLoading: isUsersLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers({
    projectId,
    selectedTokenId,
    search: searchQuery,
    filterActive,
    sortBy: sortField,
    sortDir: sortDirection,
  });
  const { stats, isStatsLoading, refetchStats } = useStats({ projectId, selectedTokenId });
  const isLoading = isUsersLoading || isStatsLoading;

  return {
    project,
    users,
    stats,
    isLoading,
    isUsersLoading,
    isStatsLoading,
    refetchUsers: refetch,
    refetchStats,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
