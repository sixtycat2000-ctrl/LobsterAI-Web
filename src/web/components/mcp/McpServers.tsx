/**
 * MCP Servers Component
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface McpServer {
  id: string;
  name: string;
  command: string;
  args?: string[];
  enabled: boolean;
  description?: string;
}

const McpServers: React.FC = () => {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await apiClient.get<{ servers: McpServer[] }>('/mcp/servers');
      if (response.success && response.data) {
        setServers(response.data.servers || []);
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleServer = async (serverId: string, enabled: boolean) => {
    try {
      const response = await apiClient.post(`/mcp/servers/${serverId}/enabled`, { enabled });
      if (response.success) {
        setServers(servers.map(s => s.id === serverId ? { ...s, enabled } : s));
      }
    } catch (error) {
      console.error('Failed to toggle server:', error);
    }
  };

  const deleteServer = async (serverId: string) => {
    if (!confirm('确定要删除这个服务器吗？')) return;
    try {
      const response = await apiClient.delete(`/mcp/servers/${serverId}`);
      if (response.success) {
        setServers(servers.filter(s => s.id !== serverId));
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-claude-border dark:border-claude-darkBorder">
        <h1 className="text-xl font-semibold dark:text-claude-darkText text-claude-text">
          MCP 服务
        </h1>
        <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary mt-1">
          管理和配置 MCP 服务
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-claude-textSecondary dark:text-claude-darkTextSecondary">
              加载中...
            </div>
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted flex items-center justify-center">
              <svg className="w-8 h-8 text-claude-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <p className="dark:text-claude-darkTextSecondary text-claude-textSecondary">
              暂无已安装的服务
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={server.id}
                className="p-4 rounded-xl border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium dark:text-claude-darkText text-claude-text">
                        {server.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        server.enabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {server.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    <p className="text-sm text-claude-textSecondary dark:text-claude-darkTextSecondary mt-1 font-mono">
                      {server.command} {server.args?.join(' ')}
                    </p>
                    {server.description && (
                      <p className="text-sm text-claude-textSecondary dark:text-claude-darkTextSecondary mt-2">
                        {server.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleServer(server.id, !server.enabled)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        server.enabled
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    >
                      {server.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => deleteServer(server.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default McpServers;
