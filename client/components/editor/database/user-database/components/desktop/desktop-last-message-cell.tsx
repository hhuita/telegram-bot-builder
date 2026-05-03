/**
 * @fileoverview Компонент ячейки последнего сообщения
 * Отображает текст и время последнего сообщения пользователя.
 * Приоритет: поле lastMessageText из данных пользователя (JOIN на сервере),
 * затем — данные из useLastMessage (HTTP-запрос), затем — lastInteraction.
 */

import { TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { useLastMessage } from '../../hooks/queries/use-last-message';
import { useLiveLastMessage } from '../../hooks/queries/use-live-last-message';
import { formatDate } from '../../../dialog/utils/format-date';

/**
 * Расширенный тип пользователя с полями последнего сообщения из JOIN
 */
type UserBotDataWithLastMessage = UserBotData & {
  /** Текст последнего сообщения (из JOIN на сервере) */
  lastMessageText?: string | null;
  /** Время последнего сообщения (из JOIN на сервере) */
  lastMessageAt?: string | Date | null;
};

/**
 * Пропсы компонента DesktopLastMessageCell
 */
interface DesktopLastMessageCellProps {
  /** Данные пользователя */
  user: UserBotData;
  /** ID проекта */
  projectId: number;
}

/**
 * Получить иконку для типа медиа
 * @param type - Тип медиафайла
 * @returns Эмодзи-иконка
 */
function getMediaIcon(type: string): string {
  switch (type) {
    case 'photo': return '📷';
    case 'video': return '🎬';
    case 'audio': return '🎵';
    case 'document': return '📄';
    case 'sticker': return '🎭';
    default: return '📎';
  }
}

/**
 * Компонент ячейки последнего сообщения пользователя.
 * Сначала показывает данные из JOIN (без запроса), затем обновляется через WS.
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopLastMessageCell({ user, projectId }: DesktopLastMessageCellProps): React.JSX.Element {
  const numericUserId = user.userId ? Number(user.userId) : 0;
  const userWithMsg = user as UserBotDataWithLastMessage;

  // Данные из JOIN — доступны сразу без HTTP-запроса
  const hasJoinData = userWithMsg.lastMessageText != null || userWithMsg.lastMessageAt != null;

  // HTTP-запрос нужен только если JOIN не вернул данные (старые записи, fallback)
  const { data: lastMessage } = useLastMessage(
    projectId,
    hasJoinData ? undefined : numericUserId  // отключаем запрос если есть JOIN-данные
  );

  // Подписка на real-time обновления через WebSocket
  useLiveLastMessage(projectId, numericUserId || null);

  // Определяем текст: WS-кэш → JOIN-данные → HTTP-данные → заглушка
  const rawText = lastMessage?.messageText ?? userWithMsg.lastMessageText;
  let messageText = (typeof rawText === 'string' && rawText.trim()) || '';

  if (!messageText && lastMessage?.media && lastMessage.media.length > 0) {
    const mediaTypes = [...new Set(lastMessage.media.map((m: any) => m.fileType ?? m.type ?? 'unknown'))];
    messageText = mediaTypes.map(getMediaIcon).join(' ') + ' Медиафайл' + (mediaTypes.length > 1 ? 'ы' : '');
  }

  if (!messageText) messageText = 'Нет сообщений';

  const timestampValue = lastMessage?.createdAt ?? userWithMsg.lastMessageAt ?? user.lastInteraction;
  const timestamp = timestampValue != null ? formatDate(timestampValue) : '';

  return (
    <TableCell className="py-2 max-w-xs">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="text-sm text-muted-foreground truncate">{messageText}</div>
        <div className="text-xs text-muted-foreground/70">{timestamp}</div>
      </div>
    </TableCell>
  );
}
