/**
 * @fileoverview Хук подписки на WebSocket для real-time обновления последнего сообщения пользователя
 * @module client/components/editor/database/user-database/hooks/queries/use-live-last-message
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { BotMessageWithMedia } from '../../types';

/**
 * Структура события new-message из WebSocket
 */
interface NewMessageEvent {
  /** Тип события */
  type: 'new-message';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number;
  /** Данные сообщения */
  data: {
    /** Идентификатор пользователя (строка) */
    userId: string;
    /** Тип сообщения: 'user' | 'bot' */
    messageType: string;
    /** Текст сообщения */
    messageText: string | null;
    /** Дополнительные данные */
    messageData: Record<string, unknown>;
    /** Идентификатор узла */
    nodeId?: string | null;
    /** Идентификатор записи в БД */
    id: number;
    /** Время создания в ISO-формате */
    createdAt: string;
  };
  /** Временная метка события */
  timestamp: string;
}

/**
 * Формирует ключ кэша React Query для useLastMessage
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns Массив-ключ кэша
 */
function buildLastMessageQueryKey(
  projectId: number,
  userId: number,
  selectedTokenId?: number | null,
): unknown[] {
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/${userId}/messages`,
    selectedTokenId,
    { limit: '1', order: 'desc', messageType: 'user' },
  );
  return [requestUrl, selectedTokenId, userId, 'last-user'];
}

/**
 * Хук подписки на WebSocket для real-time обновления последнего сообщения пользователя.
 * При получении события new-message с messageType === 'user' обновляет кэш React Query.
 * Возвращает null — хук работает только как side-effect.
 *
 * @param projectId - Идентификатор проекта
 * @param userId - Идентификатор пользователя (число)
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns null
 */
export function useLiveLastMessage(
  projectId: number,
  userId?: number | null,
  selectedTokenId?: number | null,
): null {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    let destroyed = false;
    const userIdStr = String(userId);

    const connect = () => {
      if (destroyed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/terminal?projectId=0&tokenId=0`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as NewMessageEvent;
          if (msg.type !== 'new-message') return;
          if (msg.projectId !== projectId) return;
          if (String(msg.data?.userId) !== userIdStr) return;
          // Обновляем кэш только для сообщений от пользователя
          if (msg.data.messageType !== 'user') return;

          const newMessage: BotMessageWithMedia = {
            id: msg.data.id,
            projectId,
            tokenId: selectedTokenId ?? msg.tokenId ?? 0,
            userId: msg.data.userId,
            messageType: msg.data.messageType,
            messageText: msg.data.messageText ?? null,
            messageData: msg.data.messageData ?? {},
            nodeId: msg.data.nodeId ?? null,
            primaryMediaId: null,
            createdAt: new Date(msg.data.createdAt),
            media: [],
          } as BotMessageWithMedia;

          const queryKey = buildLastMessageQueryKey(projectId, userId, selectedTokenId);
          queryClient.setQueryData<BotMessageWithMedia | null>(queryKey, newMessage);
        } catch {
          // Игнорируем некорректные сообщения
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!destroyed) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [projectId, userId, selectedTokenId, queryClient]);

  return null;
}
