import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setActiveView, toggleSidebar, openSettings } from '../../store/slices/uiSlice';
import { clearCurrentSession } from '../../store/slices/coworkSlice';
import { i18nService } from '../../services/i18n';
import ComposeIcon from '../icons/ComposeIcon';
import SearchIcon from '../icons/SearchIcon';
import ClockIcon from '../icons/ClockIcon';
import PuzzleIcon from '../icons/PuzzleIcon';
import ConnectorIcon from '../icons/ConnectorIcon';
import SidebarToggleIcon from '../icons/SidebarToggleIcon';
import SessionList from '../cowork/SessionList';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { activeView, sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const sessions = useSelector((state: RootState) => state.cowork.sessions);
  const currentSessionId = useSelector((state: RootState) => state.cowork.currentSessionId);

  const handleNewChat = () => {
    dispatch(clearCurrentSession());
    dispatch(setActiveView('cowork'));
  };

  const handleSelectSession = (sessionId: string) => {
    dispatch(setActiveView('cowork'));
    // Load session logic will be handled by the cowork view
  };

  const handleDeleteSession = (sessionId: string) => {
    // Delete session logic
  };

  const handleTogglePin = (sessionId: string, pinned: boolean) => {
    // Toggle pin logic
  };

  const handleRenameSession = (sessionId: string, title: string) => {
    // Rename session logic
  };

  if (sidebarCollapsed) {
    return (
      <aside className="shrink-0 w-14 dark:bg-claude-darkSurfaceMuted bg-claude-surfaceMuted flex flex-col items-center py-3 gap-2">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
          title={i18nService.t('expand')}
        >
          <SidebarToggleIcon className="h-4 w-4" isCollapsed={true} />
        </button>
        <button
          type="button"
          onClick={handleNewChat}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${
            activeView === 'cowork'
              ? 'bg-claude-accent/10 text-claude-accent'
              : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
          }`}
          title={i18nService.t('newChat')}
        >
          <ComposeIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => dispatch(setActiveView('tasks'))}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${
            activeView === 'tasks'
              ? 'bg-claude-accent/10 text-claude-accent'
              : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
          }`}
          title={i18nService.t('scheduledTasks')}
        >
          <ClockIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => dispatch(setActiveView('skills'))}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${
            activeView === 'skills'
              ? 'bg-claude-accent/10 text-claude-accent'
              : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
          }`}
          title={i18nService.t('skills')}
        >
          <PuzzleIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => dispatch(setActiveView('mcp'))}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${
            activeView === 'mcp'
              ? 'bg-claude-accent/10 text-claude-accent'
              : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
          }`}
          title={i18nService.t('mcpServers')}
        >
          <ConnectorIcon className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="shrink-0 w-60 dark:bg-claude-darkSurfaceMuted bg-claude-surfaceMuted flex flex-col overflow-hidden">
      {/* Header */}
      <div className="pt-3 pb-3 px-3">
        <div className="h-8 flex items-center justify-end">
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
            title={i18nService.t('collapse')}
          >
            <SidebarToggleIcon className="h-4 w-4" isCollapsed={false} />
          </button>
        </div>

        {/* Navigation */}
        <div className="mt-3 space-y-1">
          <button
            type="button"
            onClick={handleNewChat}
            className={`w-full inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
              activeView === 'cowork'
                ? 'bg-claude-accent/10 text-claude-accent hover:bg-claude-accent/20'
                : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:text-claude-text dark:hover:text-claude-darkText hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
            }`}
          >
            <ComposeIcon className="h-4 w-4" />
            {i18nService.t('newChat')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(setActiveView('tasks'))}
            className={`w-full inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
              activeView === 'tasks'
                ? 'bg-claude-accent/10 text-claude-accent hover:bg-claude-accent/20'
                : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:text-claude-text dark:hover:text-claude-darkText hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            {i18nService.t('scheduledTasks')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(setActiveView('skills'))}
            className={`w-full inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
              activeView === 'skills'
                ? 'bg-claude-accent/10 text-claude-accent hover:bg-claude-accent/20'
                : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:text-claude-text dark:hover:text-claude-darkText hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
            }`}
          >
            <PuzzleIcon className="h-4 w-4" />
            {i18nService.t('skills')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(setActiveView('mcp'))}
            className={`w-full inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
              activeView === 'mcp'
                ? 'bg-claude-accent/10 text-claude-accent hover:bg-claude-accent/20'
                : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:text-claude-text dark:hover:text-claude-darkText hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
            }`}
          >
            <ConnectorIcon className="h-4 w-4" />
            {i18nService.t('mcpServers')}
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-4">
        <div className="px-3 pb-2 text-sm font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary">
          {i18nService.t('coworkHistory')}
        </div>
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onTogglePin={handleTogglePin}
          onRenameSession={handleRenameSession}
        />
      </div>

      {/* Settings Button */}
      <div className="px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => dispatch(openSettings())}
          className="w-full inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary hover:text-claude-text dark:hover:text-claude-darkText hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M14 17H5" />
            <path d="M19 7h-9" />
            <circle cx="17" cy="17" r="3" />
            <circle cx="7" cy="7" r="3" />
          </svg>
          {i18nService.t('settings')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
