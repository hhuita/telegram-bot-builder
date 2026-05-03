/**
 * @fileoverview Контекст единого WebSocket-соединения для live-сообщений панели пользователей.
 * Одно соединение на всю панель — все строки таблицы подписываются через контекст.
 * @module client/components/editor/database/user-database/contexts/user-messages-live-context
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

/**
 * Структура события new-message из WebSocket
 */
export interface NewMessageLiveEvent {
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

/** Тип колбэка-подписчика на события */
type MessageListener = (event: NewMessageLiveEvent) => void;

/**
 * Значение контекста live-сообщений
 */
interface UserMessagesLiveContextValue {
  /**
   * Подписаться на входящие события new-message.
   * @param listener - Функция-обработчик события
   * @returns Функция отписки
   */
  subscribe: (listener: MessageListener) => () => void;
}

const UserMessagesLiveContext = createContext<UserMessagesLiveContextValue | null>(null);

/**
 * Пропсы провайдера контекста live-сообщений
 */
interface UserMessagesLiveProviderProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Дочерние элементы */
  children: React.ReactNode;
}

/**
 * Провайдер единого WebSocket-соединения для live-сообщений.
 * Открывает одно WS-соединение и рассылает события всем подписчикам.
 * @param props - Пропсы провайдера
 * @returns JSX провайдер контекста
 */
export function UserMessagesLiveProvider({ projectId, children }: UserMessagesLiveProviderProps) {
  const listenersRef = useRef<Set<MessageListener>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    destroyedRef.current = false;

    const connect = () => {
      if (destroyedRef.current) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/terminal?projectId=0&tokenId=0`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as NewMessageLiveEvent;
          if (msg.type !== 'new-message') return;
          if (msg.projectId !== projectId) return;
          listenersRef.current.forEach((fn) => fn(msg));
        } catch {
          // Игнорируем некорректные сообщения
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!destroyedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      destroyedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [projectId]);

  const subscribe = useCallback((listener: MessageListener): (() => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return (
    <UserMessagesLiveContext.Provider value={{ subscribe }}>
      {children}
    </UserMessagesLiveContext.Provider>
  );
}

/**
 * Хук доступа к контексту live-сообщений.
 * Должен использоваться внутри UserMessagesLiveProvider.
 * @returns Значение контекста или null если провайдер не найден
 */
export function useUserMessagesLiveContext(): UserMessagesLiveContextValue | null {
  return useContext(UserMessagesLiveContext);
}
