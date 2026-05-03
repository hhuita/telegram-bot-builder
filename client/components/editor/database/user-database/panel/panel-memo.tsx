/**
 * @fileoverview Memo хуки компонента UserDatabasePanel
 * @description useMemo для вычислений
 */

import { useMemo } from 'react';
import { UserBotData } from '@shared/schema';
import { VariableToQuestionMap, UserMessageCounts } from '../types';

/**
 * Пропсы для хука useVariableToQuestionMap
 */
interface UseVariableToQuestionMapParams {
  /** Данные проекта */
  projectData?: any;
}

/**
 * Пропсы для хука useUserMessageCounts
 */
interface UseUserMessageCountsParams {
  /** Сообщения деталей пользователя */
  userDetailsMessages: any[];
}

/**
 * Пропсы для хука useFilteredAndSortedUsers
 */
interface UseFilteredAndSortedUsersParams {
  /** Список пользователей (уже отфильтрованных и отсортированных сервером) */
  users: UserBotData[];
  /** Фильтр по статусу активности */
  filterActive: boolean | null;
  /** Фильтр по Premium */
  filterPremium: boolean | null;
  /** Фильтр по блокировке */
  filterBlocked: boolean | null;
}

/**
 * Хук для создания карты вопросов
 * @param params - Параметры хука
 * @returns Карта вопросов
 */
export function useVariableToQuestionMap(
  params: UseVariableToQuestionMapParams
): VariableToQuestionMap {
  const { projectData } = params;

  return useMemo(() => {
    const mapping: Record<string, string> = {};
    if (!projectData) return mapping;

    try {
      const flowData = typeof projectData === 'string'
        ? JSON.parse(projectData)
        : projectData;

      const sheets = flowData?.sheets || [];
      for (const sheet of sheets) {
        const nodes = sheet?.nodes || [];
        for (const node of nodes) {
          const data = node?.data;
          if (!data) continue;

          const questionText = data.messageText;
          if (!questionText) continue;

          if (data.inputVariable) {
            mapping[data.inputVariable] = questionText;
          }
          if (data.photoInputVariable) {
            mapping[data.photoInputVariable] = questionText;
          }
          if (data.videoInputVariable) {
            mapping[data.videoInputVariable] = questionText;
          }
          if (data.audioInputVariable) {
            mapping[data.audioInputVariable] = questionText;
          }
          if (data.documentInputVariable) {
            mapping[data.documentInputVariable] = questionText;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing project data for variable mapping:', e);
    }

    return mapping;
  }, [projectData]);
}

/**
 * Хук для подсчёта сообщений пользователя
 * @param params - Параметры хука
 * @returns Количество сообщений
 */
export function useUserMessageCounts(
  params: UseUserMessageCountsParams
): UserMessageCounts {
  const { userDetailsMessages } = params;

  return useMemo(() => {
    // Защита: если не массив, возвращаем нули
    if (!Array.isArray(userDetailsMessages) || !userDetailsMessages.length) {
      return { userSent: 0, botSent: 0, total: 0 };
    }
    const userSent = userDetailsMessages.filter(m => m.messageType === 'user').length;
    const botSent = userDetailsMessages.filter(m => m.messageType === 'bot').length;
    return { userSent, botSent, total: userDetailsMessages.length };
  }, [userDetailsMessages]);
}

/**
 * Хук для клиентской фильтрации пользователей.
 * Поиск и сортировка выполняются на сервере — здесь только локальные фильтры.
 * @param params - Параметры хука
 * @returns Отфильтрованный список пользователей
 */
export function useFilteredAndSortedUsers(
  params: UseFilteredAndSortedUsersParams
): UserBotData[] {
  const { users, filterActive, filterPremium, filterBlocked } = params;

  return useMemo(() => {
    let result = users;

    // Фильтр по активности (дублирует серверный, но нужен для мгновенного отклика UI)
    if (filterActive !== null) {
      result = result.filter(user => Boolean(user.isActive) === filterActive);
    }
    if (filterPremium !== null) {
      result = result.filter(user => Boolean(user.isPremium) === filterPremium);
    }
    if (filterBlocked !== null) {
      result = result.filter(user => Boolean(user.isBlocked) === filterBlocked);
    }

    return result;
  }, [users, filterActive, filterPremium, filterBlocked]);
}
