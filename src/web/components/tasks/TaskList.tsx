/**
 * Scheduled Tasks Component
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface ScheduledTask {
  id: string;
  title: string;
  prompt: string;
  schedule: {
    mode: 'once' | 'daily' | 'weekly' | 'monthly';
    time: string;
    enabled: boolean;
  };
  lastRunAt?: number;
  nextRunAt?: number;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await apiClient.get<{ tasks: ScheduledTask[] }>('/scheduled-tasks');
      if (response.success && response.data) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTask = async (taskId: string) => {
    try {
      await apiClient.post(`/scheduled-tasks/${taskId}/run`);
    } catch (error) {
      console.error('Failed to run task:', error);
    }
  };

  const toggleTask = async (taskId: string, enabled: boolean) => {
    try {
      const response = await apiClient.put(`/scheduled-tasks/${taskId}`, {
        schedule: { enabled },
      });
      if (response.success) {
        setTasks(tasks.map(t => 
          t.id === taskId 
            ? { ...t, schedule: { ...t.schedule, enabled } } 
            : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    try {
      const response = await apiClient.delete(`/scheduled-tasks/${taskId}`);
      if (response.success) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getScheduleText = (task: ScheduledTask) => {
    const { mode, time } = task.schedule;
    switch (mode) {
      case 'once': return `单次 - ${time}`;
      case 'daily': return `每天 ${time}`;
      case 'weekly': return `每周 ${time}`;
      case 'monthly': return `每月 ${time}`;
      default: return time;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-claude-border dark:border-claude-darkBorder">
        <h1 className="text-xl font-semibold dark:text-claude-darkText text-claude-text">
          定时任务
        </h1>
        <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary mt-1">
          管理和调度自动化任务
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-claude-textSecondary dark:text-claude-darkTextSecondary">
              加载中...
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted flex items-center justify-center">
              <svg className="w-8 h-8 text-claude-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="dark:text-claude-darkTextSecondary text-claude-textSecondary mb-2">
              暂无定时任务
            </p>
            <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary">
              创建定时任务以自动执行重复性工作
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium dark:text-claude-darkText text-claude-text">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        task.schedule.enabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {task.schedule.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    <p className="text-sm text-claude-textSecondary dark:text-claude-darkTextSecondary mt-1">
                      {getScheduleText(task)}
                    </p>
                    <p className="text-sm text-claude-textSecondary dark:text-claude-darkTextSecondary mt-2 line-clamp-2">
                      {task.prompt}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-claude-textSecondary dark:text-claude-darkTextSecondary">
                      <span>上次运行: {formatTime(task.lastRunAt)}</span>
                      <span>下次运行: {formatTime(task.nextRunAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => runTask(task.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-claude-accent hover:bg-claude-accentHover text-white transition-colors"
                    >
                      立即运行
                    </button>
                    <button
                      onClick={() => toggleTask(task.id, !task.schedule.enabled)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        task.schedule.enabled
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      }`}
                    >
                      {task.schedule.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
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

export default TaskList;
