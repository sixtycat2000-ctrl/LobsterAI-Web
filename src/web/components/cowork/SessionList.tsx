import React, { useMemo } from 'react';
import type { CoworkSessionSummary } from '../../types';
import { i18nService } from '../../services/i18n';
import SessionItem from './SessionItem';

interface SessionListProps {
  sessions: CoworkSessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onTogglePin: (sessionId: string, pinned: boolean) => void;
  onRenameSession: (sessionId: string, title: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onTogglePin,
  onRenameSession,
}) => {
  const sortedSessions = useMemo(() => {
    const sortByRecentActivity = (a: CoworkSessionSummary, b: CoworkSessionSummary) => {
      if (b.updatedAt !== a.updatedAt) {
        return b.updatedAt - a.updatedAt;
      }
      return b.createdAt - a.createdAt;
    };

    const pinnedSessions = sessions.filter((session) => session.pinned).sort(sortByRecentActivity);
    const unpinnedSessions = sessions.filter((session) => !session.pinned).sort(sortByRecentActivity);
    return [...pinnedSessions, ...unpinnedSessions];
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary">
          {i18nService.t('coworkNoSessions')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedSessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          isActive={session.id === currentSessionId}
          onSelect={() => onSelectSession(session.id)}
          onDelete={() => onDeleteSession(session.id)}
          onTogglePin={(pinned) => onTogglePin(session.id, pinned)}
          onRename={(title) => onRenameSession(session.id, title)}
        />
      ))}
    </div>
  );
};

export default SessionList;
