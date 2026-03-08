import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon, StopIcon, PaperClipIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { i18nService } from '../../services/i18n';
import type { CoworkImageAttachment } from '../../types';

interface MessageInputProps {
  onSubmit: (prompt: string, skillPrompt?: string, imageAttachments?: CoworkImageAttachment[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onManageSkills?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSubmit,
  onStop,
  isStreaming = false,
  placeholder = 'Enter your task...',
  disabled = false,
}) => {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<CoworkImageAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 24), 200)}px`;
    }
  }, [value]);

  const handleSubmit = useCallback(() => {
    const trimmedValue = value.trim();
    if ((!trimmedValue && attachments.length === 0) || isStreaming || disabled) return;

    onSubmit(trimmedValue, undefined, attachments.length > 0 ? attachments : undefined);
    setValue('');
    setAttachments([]);
  }, [value, attachments, isStreaming, disabled, onSubmit]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isComposing = event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;
    if (event.key === 'Enter' && !event.shiftKey && !isComposing && !isStreaming && !disabled) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type,
            base64Data: base64Content,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (disabled || isStreaming) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result as string;
          const base64Content = base64Data.split(',')[1];
          setAttachments((prev) => [
            ...prev,
            {
              name: 'pasted-image.png',
              mimeType: file.type,
              base64Data: base64Content,
            },
          ]);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [disabled, isStreaming]);

  const canSubmit = !disabled && (!!value.trim() || attachments.length > 0);

  return (
    <div className="relative">
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 rounded-full border dark:border-claude-darkBorder border-claude-border dark:bg-claude-darkSurface bg-claude-surface px-2.5 py-1 text-xs dark:text-claude-darkText text-claude-text"
            >
              <img
                src={`data:${attachment.mimeType};base64,${attachment.base64Data}`}
                alt={attachment.name}
                className="w-6 h-6 rounded object-cover"
              />
              <span className="truncate max-w-[100px]">{attachment.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="rounded-full p-0.5 hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="flex items-end gap-2 p-3 rounded-xl border dark:border-claude-darkBorder border-claude-border dark:bg-claude-darkSurface bg-claude-surface">
        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Add file button */}
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={disabled || isStreaming}
          className="flex-shrink-0 p-1.5 rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary dark:hover:bg-claude-darkSurfaceHover hover:bg-claude-surfaceHover dark:hover:text-claude-darkText hover:text-claude-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={i18nService.t('coworkAddFile')}
        >
          <PaperClipIcon className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent dark:text-claude-darkText text-claude-text placeholder:dark:text-claude-darkTextSecondary placeholder:text-claude-textSecondary focus:outline-none text-sm leading-relaxed min-h-[24px] max-h-[200px]"
        />

        {/* Submit/Stop button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex-shrink-0 p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-subtle hover:shadow-card active:scale-95"
          >
            <StopIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-shrink-0 p-2 rounded-lg bg-claude-accent hover:bg-claude-accentHover text-white transition-all shadow-subtle hover:shadow-card active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
