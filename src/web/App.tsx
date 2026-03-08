/**
 * Main Application Component for Web Build
 * Handles routing, layout, and initialization
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { apiClient } from './api/client';
import { wsClient } from './api/websocket';
import { isWebBuild } from './utils/platform';

// Import components
import Sidebar from './components/layout/Sidebar';
import CoworkView from './components/cowork/CoworkView';
import SettingsPanel from './components/settings/SettingsPanel';
import SkillsList from './components/skills/SkillsList';
import McpServers from './components/mcp/McpServers';
import TaskList from './components/tasks/TaskList';

type ViewType = 'cowork' | 'settings' | 'skills' | 'mcp' | 'tasks';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('cowork');
  const hasInitialized = useRef(false);
  const dispatch = useDispatch();

  // Initialize application
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const initializeApp = async () => {
      try {
        // Mark platform for CSS styling
        const platform = isWebBuild() ? 'web' : 'electron';
        document.documentElement.classList.add(`platform-${platform}`);

        // Initialize theme from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }

        // Connect WebSocket for real-time updates
        await wsClient.connect();
        console.log('[Web App] WebSocket connected');

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError('Failed to initialize application');
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [dispatch]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="h-screen overflow-hidden flex flex-col">
        <div className="flex-1 flex items-center justify-center dark:bg-claude-darkBg bg-claude-bg">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-claude-accent to-claude-accentHover flex items-center justify-center shadow-glow-accent animate-pulse">
              <span className="text-white text-2xl font-bold">L</span>
            </div>
            <div className="w-24 h-1 rounded-full bg-claude-accent/20 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-claude-accent animate-shimmer" />
            </div>
            <div className="dark:text-claude-darkText text-claude-text text-xl font-medium">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (initError) {
    return (
      <div className="h-screen overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center dark:bg-claude-darkBg bg-claude-bg">
          <div className="flex flex-col items-center space-y-6 max-w-md px-6">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">!</span>
            </div>
            <div className="dark:text-claude-darkText text-claude-text text-xl font-medium text-center">
              {initError}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-claude-accent hover:bg-claude-accentHover text-white rounded-xl shadow-md transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="h-screen overflow-hidden flex flex-col dark:bg-claude-darkSurfaceMuted bg-claude-surfaceMuted">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        {/* Main content area */}
        <div className="flex-1 min-w-0 py-1.5 pr-1.5 pl-1.5">
          <div className="h-full min-h-0 rounded-xl dark:bg-claude-darkBg bg-claude-bg overflow-hidden">
            {currentView === 'cowork' && <CoworkView />}
            {currentView === 'settings' && <SettingsPanel />}
            {currentView === 'skills' && <SkillsList />}
            {currentView === 'mcp' && <McpServers />}
            {currentView === 'tasks' && <TaskList />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
