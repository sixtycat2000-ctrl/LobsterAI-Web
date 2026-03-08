/**
 * Appearance Settings Component
 */

import React, { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Language = 'zh' | 'en';

const AppearanceSettings: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState<Language>('zh');

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    // Apply theme
    const applyTheme = (t: Theme) => {
      if (t === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', t === 'dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-medium dark:text-claude-darkText text-claude-text mb-4">
          外观设置
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-3">
              主题
            </label>
            <div className="flex gap-3">
              {[
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
                { value: 'system', label: '跟随系统' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as Theme)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    theme === option.value
                      ? 'bg-claude-accent text-white'
                      : 'bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text hover:bg-claude-border dark:hover:bg-claude-darkBorder'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-3">
              语言
            </label>
            <div className="flex gap-3">
              {[
                { value: 'zh', label: '中文' },
                { value: 'en', label: 'English' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLanguage(option.value as Language)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    language === option.value
                      ? 'bg-claude-accent text-white'
                      : 'bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text hover:bg-claude-border dark:hover:bg-claude-darkBorder'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
