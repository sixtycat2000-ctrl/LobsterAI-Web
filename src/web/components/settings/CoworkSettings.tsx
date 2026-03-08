/**
 * Cowork Settings Component
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface CoworkConfig {
  workingDirectory: string;
  systemPrompt: string;
  executionMode: 'auto' | 'local' | 'sandbox';
}

const CoworkSettings: React.FC = () => {
  const [config, setConfig] = useState<CoworkConfig>({
    workingDirectory: '',
    systemPrompt: '',
    executionMode: 'auto',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await apiClient.get<any>('/cowork/config');
      if (response.success && response.data) {
        setConfig({
          workingDirectory: response.data.workingDirectory || '',
          systemPrompt: response.data.systemPrompt || '',
          executionMode: response.data.executionMode || 'auto',
        });
      }
    } catch (error) {
      console.error('Failed to load cowork config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/cowork/config', config);
      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-medium dark:text-claude-darkText text-claude-text mb-4">
          协作配置
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-2">
              工作目录
            </label>
            <input
              type="text"
              value={config.workingDirectory}
              onChange={(e) => setConfig({ ...config, workingDirectory: e.target.value })}
              placeholder="/path/to/your/project"
              className="w-full px-4 py-2.5 rounded-lg border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text outline-none focus:border-claude-accent"
            />
            <p className="mt-1 text-xs text-claude-textSecondary dark:text-claude-darkTextSecondary">
              AI 将在此目录中执行文件操作
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-2">
              系统提示词
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder="输入系统提示词..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text outline-none focus:border-claude-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-2">
              执行模式
            </label>
            <select
              value={config.executionMode}
              onChange={(e) => setConfig({ ...config, executionMode: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-lg border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text outline-none focus:border-claude-accent"
            >
              <option value="auto">自动选择</option>
              <option value="local">本地执行</option>
              <option value="sandbox">沙盒执行</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-claude-border dark:border-claude-darkBorder">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-claude-accent hover:bg-claude-accentHover text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? '保存中...' : saved ? '已保存 ✓' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default CoworkSettings;
