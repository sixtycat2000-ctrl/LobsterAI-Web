import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setTheme, setLanguage } from '../../store/slices/uiSlice';
import { i18nService } from '../../services/i18n';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { theme, language, activeView } = useSelector((state: RootState) => state.ui);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(newTheme));
    // Apply theme
    const root = document.documentElement;
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    dispatch(setLanguage(newLanguage));
    i18nService.setLanguage(newLanguage);
  };

  const getTitle = () => {
    switch (activeView) {
      case 'cowork':
        return 'LobsterAI';
      case 'skills':
        return i18nService.t('skills');
      case 'mcp':
        return i18nService.t('mcpServers');
      case 'tasks':
        return i18nService.t('scheduledTasks');
      case 'settings':
        return i18nService.t('settings');
      default:
        return 'LobsterAI';
    }
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b dark:border-claude-darkBorder border-claude-border shrink-0 bg-transparent">
      <h1 className="text-lg font-semibold dark:text-claude-darkText text-claude-text">
        {getTitle()}
      </h1>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as 'zh' | 'en')}
          className="h-8 px-2 text-sm rounded-lg border dark:border-claude-darkBorder border-claude-border dark:bg-claude-darkSurface bg-claude-surface dark:text-claude-darkText text-claude-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-claude-accent"
        >
          <option value="zh">{i18nService.t('chinese')}</option>
          <option value="en">{i18nService.t('english')}</option>
        </select>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
          title={i18nService.t('theme')}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
