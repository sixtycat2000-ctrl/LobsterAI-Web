import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { i18nService } from '../../services/i18n';
import type { CoworkMessage, CoworkImageAttachment } from '../../types';
import MessageInput from './MessageInput';
import MarkdownContent from '../ui/MarkdownContent';
import { CheckIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';

interface SessionDetailProps {
  onManageSkills?: () => void;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ onManageSkills }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { currentSession, isStreaming, config } = useSelector((state: RootState) => state.cowork);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAutoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, isAutoScrollEnabled]);

  // Handle scroll to detect if user has scrolled up
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setIsAutoScrollEnabled(isAtBottom);
  }, []);

  const handleContinue = async (prompt: string, skillPrompt?: string, imageAttachments?: CoworkImageAttachment[]) => {
    if (!currentSession || isStreaming) return;
    setIsLoading(true);
    try {
      await apiClient.continueSession(currentSession.id, { prompt, systemPrompt: skillPrompt });
    } catch (error) {
      console.error('Failed to continue session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!currentSession) return;
    try {
      await apiClient.stopSession(currentSession.id);
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center dark:bg-claude-darkBg bg-claude-bg">
        <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary">
          {i18nService.t('coworkNoSessions')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col dark:bg-claude-darkBg bg-claude-bg h-full overflow-hidden">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b dark:border-claude-darkBorder border-claude-border shrink-0">
        <h2 className="text-base font-semibold dark:text-claude-darkText text-claude-text truncate">
          {currentSession.title}
        </h2>
        <div className="flex items-center gap-2">
          {currentSession.cwd && (
            <span className="text-xs dark:text-claude-darkTextSecondary text-claude-textSecondary">
              {currentSession.cwd}
            </span>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-claude-accent">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
              </svg>
              {i18nService.t('coworkStatusRunning')}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {currentSession.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t dark:border-claude-darkBorder border-claude-border p-4">
        <MessageInput
          onSubmit={handleContinue}
          onStop={handleStop}
          isStreaming={isStreaming || isLoading}
          placeholder={i18nService.t('coworkPlaceholder')}
          onManageSkills={onManageSkills}
        />
      </div>
    </div>
  );
};

// Message Item Component
const MessageItem: React.FC<{ message: CoworkMessage }> = ({ message }) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';
  const isToolUse = message.type === 'tool_use';
  const isToolResult = message.type === 'tool_result';
  const isError = message.metadata?.isError;

  const imageAttachments = useMemo(() => {
    if (!isUser) return null;
    const imgs = (message.metadata as { imageAttachments?: CoworkImageAttachment[] })?.imageAttachments;
    if (!imgs || imgs.length === 0) return null;
    return imgs;
  }, [isUser, message.metadata]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Image attachments */}
        {imageAttachments && imageAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {imageAttachments.map((img, idx) => (
              <div key={idx} className="relative">
                <img
                  src={`data:${img.mimeType};base64,${img.base64Data}`}
                  alt={img.name}
                  className="max-w-[200px] max-h-[200px] rounded-lg border dark:border-claude-darkBorder border-claude-border"
                />
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser
              ? 'bg-claude-accent text-white'
              : isError
                ? 'bg-red-500/10 border border-red-500/20'
                : 'dark:bg-claude-darkSurface bg-claude-surface border dark:border-claude-darkBorder border-claude-border'
          }`}
        >
          {isToolUse && message.metadata?.toolName && (
            <div className="text-xs font-medium text-claude-accent mb-1">
              {message.metadata.toolName}
            </div>
          )}

          {isToolResult && (
            <div className="text-xs font-medium mb-1">
              {isError ? (
                <span className="text-red-500">{i18nService.t('coworkStatusError')}</span>
              ) : (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckIcon className="h-3 w-3" />
                  Success
                </span>
              )}
            </div>
          )}

          <div className={isUser ? 'text-white' : 'dark:text-claude-darkText text-claude-text'}>
            {isAssistant ? (
              <MarkdownContent content={message.content} />
            ) : (
              <p className="text-[15px] leading-6 whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] mt-1 ${isUser ? 'text-right' : 'text-left'} dark:text-claude-darkTextSecondary/70 text-claude-textSecondary/70`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
