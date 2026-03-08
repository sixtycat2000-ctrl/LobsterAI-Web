/**
 * Skills List Component
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version?: string;
}

const SkillsList: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await apiClient.get<{ skills: Skill[] }>('/skills');
      if (response.success && response.data) {
        setSkills(response.data.skills || []);
      }
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = async (skillId: string, enabled: boolean) => {
    try {
      const response = await apiClient.post('/skills/enabled', { skillId, enabled });
      if (response.success) {
        setSkills(skills.map(s => s.id === skillId ? { ...s, enabled } : s));
      }
    } catch (error) {
      console.error('Failed to toggle skill:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-claude-border dark:border-claude-darkBorder">
        <h1 className="text-xl font-semibold dark:text-claude-darkText text-claude-text">
          技能管理
        </h1>
        <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary mt-1">
          管理和配置 AI 技能
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-claude-textSecondary dark:text-claude-darkTextSecondary">
              加载中...
            </div>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted flex items-center justify-center">
              <svg className="w-8 h-8 text-claude-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="dark:text-claude-darkTextSecondary text-claude-textSecondary">
              暂无可用技能
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 rounded-xl border border-claude-border dark:border-claude-darkBorder bg-claude-surfaceMuted dark:bg-claude-darkSurfaceMuted"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium dark:text-claude-darkText text-claude-text">
                      {skill.name}
                    </h3>
                    {skill.version && (
                      <span className="text-xs text-claude-textSecondary dark:text-claude-darkTextSecondary">
                        v{skill.version}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleSkill(skill.id, !skill.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      skill.enabled ? 'bg-claude-accent' : 'bg-claude-border dark:bg-claude-darkBorder'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        skill.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm dark:text-claude-darkTextSecondary text-claude-textSecondary line-clamp-2">
                  {skill.description || '暂无描述'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsList;
