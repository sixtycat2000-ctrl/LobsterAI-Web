/**
 * Main Cowork View Component
 * Displays session list and chat interface
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import SessionList from './SessionList';
import SessionDetail from './SessionDetail';
import MessageInput from './MessageInput';
import { loadSessions, selectSession } from '../../store/slices/coworkSlice';

const CoworkView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { sessions, selectedSessionId, isLoading } = useSelector((state: RootState) => state.cowork);
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  useEffect(() => {
    dispatch(loadSessions());
  }, [dispatch]);

  return (
    <div className="flex h-full">
      {/* Session List Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted">
        <SessionList />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedSession ? (
          <>
            <SessionDetail session={selectedSession} />
            <MessageInput sessionId={selectedSession.id} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-claude-accent to-claude-accentHover flex items-center justify-center shadow-glow-accent">
                <span className="text-white text-3xl font-bold">L</span>
              </div>
              <h2 className="text-2xl font-bold dark:text-claude-darkText text-claude-text mb-2">
                欢迎使用 LobsterAI
              </h2>
              <p className="dark:text-claude-darkTextSecondary text-claude-textSecondary mb-6">
                与 AI 协作，让编码更高效
              </p>
              <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary">
                选择一个会话或创建新对话开始
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoworkView;
