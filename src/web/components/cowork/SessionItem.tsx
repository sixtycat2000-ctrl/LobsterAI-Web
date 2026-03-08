import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { CoworkSessionSummary, CoworkSessionStatus } from '../../types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { i18nService } from '../../services/i18n';

interface SessionItemProps {
  session: CoworkSessionSummary;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: (pinned: boolean) => void;
  onRename: (title: string) => void;
}

const statusLabels: Record<CoworkSessionStatus, string> = {
  idle: 'coworkStatusIdle',
  running: 'coworkStatusRunning',
  completed: 'coworkStatusCompleted',
  error: 'coworkStatusError',
};

const PushPinIcon: React.FC<React.SVGProps<SVGSVGElement> & { slashed?: boolean }> = ({
  slashed,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <g transform="rotate(45 12 12)">
      <path d="M9 3h6l-1 5 2 2v2H8v-2l2-2-1-5z" />
      <path d="M12 12v9" />
    </g>
    {slashed && <path d="M5 5L19 19" />}
  </svg>
);

const formatRelativeTime = (timestamp: number): { compact: string; full: string } => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return { compact: 'now', full: i18nService.t('justNow') };
  } else if (minutes < 60) {
    return { compact: `${minutes}m`, full: `${minutes} ${i18nService.t('minutesAgo')}` };
  } else if (hours < 24) {
    return { compact: `${hours}h`, full: `${hours} ${i18nService.t('hoursAgo')}` };
  } else if (days === 1) {
    return { compact: '1d', full: i18nService.t('yesterday') };
  } else {
    return { compact: `${days}d`, full: `${days} ${i18nService.t('daysAgo')}` };
  }
};

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
  onRename,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) {
      setRenameValue(session.title);
    }
  }, [isRenaming, session.title]);

  useEffect(() => {
    if (isRenaming) {
      requestAnimationFrame(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      });
    }
  }, [isRenaming]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleRenameSave = () => {
    const nextTitle = renameValue.trim();
    if (nextTitle && nextTitle !== session.title) {
      onRename(nextTitle);
    }
    setIsRenaming(false);
  };

  const relativeTime = formatRelativeTime(session.updatedAt);
  const showRunningIndicator = session.status === 'running';

  const menuItems = useMemo(() => [
    { key: 'rename', label: i18nService.t('renameConversation'), onClick: () => { setShowMenu(false); setIsRenaming(true); } },
    { key: 'pin', label: session.pinned ? i18nService.t('coworkUnpinSession') : i18nService.t('coworkPinSession'), onClick: () => { setShowMenu(false); onTogglePin(!session.pinned); } },
    { key: 'delete', label: i18nService.t('deleteSession'), onClick: () => { setShowMenu(false); setShowConfirmDelete(true); }, danger: true },
  ], [session.pinned, onTogglePin]);

  return (
    <div
      onClick={() => {
        if (!isRenaming) {
          setShowMenu(false);
          onSelect();
        }
      }}
      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-black/[0.06] dark:bg-white/[0.08]'
          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1 gap-2">
          {showRunningIndicator && (
            <span className="block w-2 h-2 rounded-full bg-claude-accent flex-shrink-0 shadow-[0_0_6px_rgba(59,130,246,0.5)] animate-pulse" />
          )}
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSave();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              onBlur={handleRenameSave}
              className="flex-1 min-w-0 rounded-lg border dark:border-claude-darkBorder border-claude-border dark:bg-claude-darkBg bg-claude-bg px-2 py-1 text-sm font-medium dark:text-claude-darkText text-claude-text focus:outline-none focus:ring-2 focus:ring-claude-accent"
            />
          ) : (
            <h3 className="text-sm font-medium dark:text-claude-darkText text-claude-text truncate">
              {session.title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs dark:text-claude-darkTextSecondary text-claude-textSecondary">
          <span className="whitespace-nowrap" title={relativeTime.full}>
            {relativeTime.compact}
          </span>
          <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">
            {i18nService.t(statusLabels[session.status])}
          </span>
        </div>
      </div>

      {/* Actions */}
      {!isRenaming && (
        <div className={`absolute right-1.5 top-1.5 ${session.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 rounded-lg bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkTextSecondary text-claude-textSecondary dark:hover:bg-claude-darkSurface hover:bg-claude-surface transition-colors"
            >
              {session.pinned ? (
                <span className="relative block h-4 w-4">
                  <PushPinIcon className="h-4 w-4" />
                </span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              )}
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-xl border dark:border-claude-darkBorder border-claude-border dark:bg-claude-darkSurface bg-claude-surface shadow-lg overflow-hidden z-50">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); item.onClick(); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      item.danger
                        ? 'text-red-500 hover:bg-red-500/10'
                        : 'dark:text-claude-darkText text-claude-text hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowConfirmDelete(false)}
        >
          <div
            className="w-full max-w-sm mx-4 dark:bg-claude-darkSurface bg-claude-surface rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-500" />
              </div>
              <h2 className="text-base font-semibold dark:text-claude-darkText text-claude-text">
                {i18nService.t('deleteTaskConfirmTitle')}
              </h2>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t dark:border-claude-darkBorder border-claude-border">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary dark:hover:bg-claude-darkSurfaceHover hover:bg-claude-surfaceHover transition-colors"
              >
                {i18nService.t('cancel')}
              </button>
              <button
                onClick={() => { setShowConfirmDelete(false); onDelete(); }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                {i18nService.t('deleteSession')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionItem;
