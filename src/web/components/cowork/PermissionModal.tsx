import React from 'react';
import type { CoworkPermissionRequest, CoworkPermissionResult } from '../../types';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { i18nService } from '../../services/i18n';

interface PermissionModalProps {
  permission: CoworkPermissionRequest;
  onRespond: (result: CoworkPermissionResult) => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ permission, onRespond }) => {
  const formatToolInput = (input: Record<string, unknown>): string => {
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      return String(input);
    }
  };

  const isDangerousBash = (() => {
    if (permission.toolName !== 'Bash') return false;
    const command = String((permission.toolInput as Record<string, unknown>)?.command ?? '');
    const dangerousPatterns = [
      /\brm\s+-rf?\b/i,
      /\bsudo\b/i,
      /\bdd\b/i,
      /\bmkfs\b/i,
      /\bformat\b/i,
      />\s*\/dev\//i,
    ];
    return dangerousPatterns.some(pattern => pattern.test(command));
  })();

  const handleApprove = () => {
    onRespond({
      behavior: 'allow',
      updatedInput: permission.toolInput,
    });
  };

  const handleDeny = () => {
    onRespond({
      behavior: 'deny',
      message: 'Permission denied',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 dark:bg-claude-darkSurface bg-claude-surface rounded-2xl shadow-modal overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b dark:border-claude-darkBorder border-claude-border">
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold dark:text-claude-darkText text-claude-text">
              {i18nService.t('coworkPermissionRequired')}
            </h2>
            <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary">
              {i18nService.t('coworkPermissionDescription')}
            </p>
          </div>
          <button
            onClick={handleDeny}
            className="p-2 rounded-lg dark:hover:bg-claude-darkSurfaceHover hover:bg-claude-surfaceHover dark:text-claude-darkTextSecondary text-claude-textSecondary transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Tool name */}
          <div>
            <label className="block text-xs font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary uppercase tracking-wider mb-1">
              {i18nService.t('coworkToolName')}
            </label>
            <div className="px-3 py-2 rounded-lg dark:bg-claude-darkBg bg-claude-bg">
              <code className="text-sm dark:text-claude-darkText text-claude-text">
                {permission.toolName}
              </code>
            </div>
          </div>

          {/* Tool input */}
          <div>
            <label className="block text-xs font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary uppercase tracking-wider mb-1">
              {i18nService.t('coworkToolInput')}
            </label>
            <div className="px-3 py-2 rounded-lg dark:bg-claude-darkBg bg-claude-bg max-h-48 overflow-y-auto">
              <pre className="text-xs dark:text-claude-darkText text-claude-text whitespace-pre-wrap break-words font-mono">
                {formatToolInput(permission.toolInput)}
              </pre>
            </div>
          </div>

          {/* Warning for dangerous operations */}
          {isDangerousBash && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">
                This command may cause irreversible changes. Proceed with caution.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-claude-darkBorder border-claude-border">
          <button
            onClick={handleDeny}
            className="px-4 py-2 text-sm font-medium rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary dark:hover:bg-claude-darkSurfaceHover hover:bg-claude-surfaceHover transition-colors"
          >
            {i18nService.t('coworkDeny')}
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-claude-accent hover:bg-claude-accentHover text-white transition-colors"
          >
            {i18nService.t('coworkApprove')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
