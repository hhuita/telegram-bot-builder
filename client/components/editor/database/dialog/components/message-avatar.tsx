/**
 * @fileoverview Компонент аватара сообщения
 * Отображает иконку бота или пользователя с поддержкой реальных аватарок
 */

import { UserAvatar } from './user-avatar';
import { UserBotData } from '@shared/schema';

/**
 * Свойства аватара
 */
interface MessageAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
  /** Данные пользователя для avatarUrl */
  user?: UserBotData | null;
  /** Данные бота для avatarUrl */
  bot?: UserBotData | null;
  /** Идентификатор проекта для прокси аватара */
  projectId?: number;
  /** Идентификатор токена для резолва аватара */
  tokenId?: number | null;
}

/**
 * Компонент аватара для сообщения
 */
export function MessageAvatar({ messageType, user, bot, projectId, tokenId }: MessageAvatarProps) {
  const avatarData = messageType === 'bot' ? bot : user;
  return <UserAvatar messageType={messageType} user={avatarData} projectId={projectId} tokenId={tokenId} />;
}
