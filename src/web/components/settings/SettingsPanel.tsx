/**
 * Settings Panel Component
 * Main settings interface
 */

import React, { useState } from 'react';
import ApiSettings from './ApiSettings';
import CoworkSettings from './CoworkSettings';
import AppearanceSettings from './AppearanceSettings';

type TabType = 'api' | 'cowork' | 'appearance';

const SettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('api');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'api', label: 'API' },
    { id: 'cowork', label: '协作' },
    { id: 'appearance', label: '外观' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-claude-border dark:border-claude-darkBorder">
        <h1 className="text-xl font-semibold dark:text-claude-darkText text-claude-text">
          设置
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-claude-border dark:border-claude-darkBorder">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-claude-accent'
                : 'text-claude-textSecondary dark:text-claude-darkTextSecondary hover:text-claude-text dark:hover:text-claude-darkText'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-claude-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'api' && <ApiSettings />}
        {activeTab === 'cowork' && <CoworkSettings />}
        {activeTab === 'appearance' && <AppearanceSettings />}
      </div>
    </div>
  );
};

export default SettingsPanel;
