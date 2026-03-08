/**
 * API Settings Component
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const ApiSettings: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>({
    apiKey: '',
    baseUrl: '',
    model: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await apiClient.get<any>('/store/app_config');
      if (response.success && response.data) {
        setConfig({
          apiKey: response.data.api?.key || '',
          baseUrl: response.data.api?.baseUrl || '',
          model: response.data.model?.defaultModel || '',
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/store/app_config', {
        api: {
          key: config.apiKey,
          baseUrl: config.baseUrl,
        },
        model: {
          defaultModel: config.model,
        },
      });
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
          API 配置
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-2">
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="输入你的 API Key"
              className="w-full px-4 py-2.5 rounded-lg border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text outline-none focus:border-claude-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-2">
              API Base URL
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://api.anthropic.com"
              className="w-full px-4 py-2.5 rounded-lg border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text outline-none focus:border-claude-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-claude-darkText text-claude-text mb-2">
              模型
            </label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="claude-sonnet-4-6"
              className="w-full px-4 py-2.5 rounded-lg border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted dark:text-claude-darkText text-claude-text outline-none focus:border-claude-accent"
            />
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

export default ApiSettings;
