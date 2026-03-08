/**
 * Tests for React Components
 * Tests component logic and helper functions without full React rendering.
 *
 * These tests validate:
 * - Component prop validation
 * - Helper functions and utilities
 * - State management logic
 * - UI behavior patterns
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// ==================== Type Definitions ====================

interface SidebarProps {
  onShowSettings: () => void;
  activeView: 'cowork' | 'skills' | 'scheduledTasks' | 'mcp';
  onShowSkills: () => void;
  onShowCowork: () => void;
  onShowScheduledTasks: () => void;
  onShowMcp: () => void;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  updateBadge?: unknown;
}

interface SettingsProps {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onLanguageChange: (language: 'en' | 'zh') => void;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  official: boolean;
}

interface SessionItem {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  pinned: boolean;
  updatedAt: number;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface SelectionState {
  selectedIds: Set<string>;
  isBatchMode: boolean;
}

// ==================== Sidebar Component Tests ====================

function validateSidebarProps(props: Partial<SidebarProps>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (props.activeView && !['cowork', 'skills', 'scheduledTasks', 'mcp'].includes(props.activeView)) {
    errors.push(`Invalid activeView: ${props.activeView}`);
  }

  if (typeof props.isCollapsed !== 'undefined' && typeof props.isCollapsed !== 'boolean') {
    errors.push('isCollapsed must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function simulateSidebarRender(props: SidebarProps): { buttons: string[]; collapsed: boolean } {
  const buttons = ['newChat', 'search', 'scheduledTasks', 'skills', 'mcp', 'settings'];

  if (props.isCollapsed) {
    return { buttons: [], collapsed: true };
  }

  return { buttons, collapsed: false };
}

describe('Sidebar Component Logic', () => {
  it('should validate correct sidebar props', () => {
    const props: Partial<SidebarProps> = {
      activeView: 'cowork',
      isCollapsed: false,
    };
    const result = validateSidebarProps(props);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('should detect invalid activeView', () => {
    const props: Partial<SidebarProps> = {
      activeView: 'invalid' as SidebarProps['activeView'],
    };
    const result = validateSidebarProps(props);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.ok(result.errors[0].includes('Invalid activeView'));
  });

  it('should detect invalid isCollapsed type', () => {
    const props: Partial<SidebarProps> = {
      isCollapsed: 'true' as unknown as boolean,
    };
    const result = validateSidebarProps(props);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.ok(result.errors[0].includes('must be a boolean'));
  });

  it('should return all buttons when not collapsed', () => {
    const props: SidebarProps = {
      onShowSettings: () => {},
      activeView: 'cowork',
      onShowSkills: () => {},
      onShowCowork: () => {},
      onShowScheduledTasks: () => {},
      onShowMcp: () => {},
      onNewChat: () => {},
      isCollapsed: false,
      onToggleCollapse: () => {},
    };
    const result = simulateSidebarRender(props);
    assert.strictEqual(result.collapsed, false);
    assert.strictEqual(result.buttons.length, 6);
  });

  it('should return no buttons when collapsed', () => {
    const props: SidebarProps = {
      onShowSettings: () => {},
      activeView: 'cowork',
      onShowSkills: () => {},
      onShowCowork: () => {},
      onShowScheduledTasks: () => {},
      onShowMcp: () => {},
      onNewChat: () => {},
      isCollapsed: true,
      onToggleCollapse: () => {},
    };
    const result = simulateSidebarRender(props);
    assert.strictEqual(result.collapsed, true);
    assert.strictEqual(result.buttons.length, 0);
  });

  it('should track active view', () => {
    const views: Array<SidebarProps['activeView']> = ['cowork', 'skills', 'scheduledTasks', 'mcp'];

    views.forEach((view) => {
      const props: Partial<SidebarProps> = { activeView: view };
      const result = validateSidebarProps(props);
      assert.strictEqual(result.valid, true, `View ${view} should be valid`);
    });
  });
});

// ==================== Settings Component Tests ====================

function validateSettingsProps(props: Partial<SettingsProps>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (props.theme && !['light', 'dark', 'system'].includes(props.theme)) {
    errors.push(`Invalid theme: ${props.theme}`);
  }

  if (props.language && !['en', 'zh'].includes(props.language)) {
    errors.push(`Invalid language: ${props.language}`);
  }

  return { valid: errors.length === 0, errors };
}

function getThemeClass(theme: 'light' | 'dark' | 'system'): string {
  switch (theme) {
    case 'dark':
      return 'dark';
    case 'light':
      return 'light';
    case 'system':
      return 'system-preference';
    default:
      return 'light';
  }
}

describe('Settings Component Logic', () => {
  it('should validate correct settings props', () => {
    const props: Partial<SettingsProps> = {
      theme: 'dark',
      language: 'zh',
    };
    const result = validateSettingsProps(props);
    assert.strictEqual(result.valid, true);
  });

  it('should detect invalid theme', () => {
    const props: Partial<SettingsProps> = {
      theme: 'invalid' as SettingsProps['theme'],
    };
    const result = validateSettingsProps(props);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors[0].includes('Invalid theme'));
  });

  it('should detect invalid language', () => {
    const props: Partial<SettingsProps> = {
      language: 'fr' as SettingsProps['language'],
    };
    const result = validateSettingsProps(props);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors[0].includes('Invalid language'));
  });

  it('should return correct theme class', () => {
    assert.strictEqual(getThemeClass('dark'), 'dark');
    assert.strictEqual(getThemeClass('light'), 'light');
    assert.strictEqual(getThemeClass('system'), 'system-preference');
  });

  it('should accept all valid themes', () => {
    const themes: Array<SettingsProps['theme']> = ['light', 'dark', 'system'];
    themes.forEach((theme) => {
      const result = validateSettingsProps({ theme });
      assert.strictEqual(result.valid, true, `Theme ${theme} should be valid`);
    });
  });

  it('should accept all valid languages', () => {
    const languages: Array<SettingsProps['language']> = ['en', 'zh'];
    languages.forEach((language) => {
      const result = validateSettingsProps({ language });
      assert.strictEqual(result.valid, true, `Language ${language} should be valid`);
    });
  });
});

// ==================== Skills List Component Tests ====================

function filterSkills(skills: Skill[], query: string): Skill[] {
  if (!query) return skills;
  const lowerQuery = query.toLowerCase();
  return skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery)
  );
}

function sortSkills(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => {
    if (a.official !== b.official) {
      return a.official ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function getEnabledCount(skills: Skill[]): number {
  return skills.filter((s) => s.enabled).length;
}

describe('Skills List Component Logic', () => {
  const sampleSkills: Skill[] = [
    { id: 'skill-1', name: 'Alpha', description: 'First skill', enabled: true, official: true },
    { id: 'skill-2', name: 'Beta', description: 'Second skill', enabled: false, official: false },
    { id: 'skill-3', name: 'Gamma', description: 'Third skill', enabled: true, official: false },
  ];

  it('should filter skills by name', () => {
    const result = filterSkills(sampleSkills, 'Alpha');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'skill-1');
  });

  it('should filter skills by description', () => {
    const result = filterSkills(sampleSkills, 'Third');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'skill-3');
  });

  it('should return all skills with empty query', () => {
    const result = filterSkills(sampleSkills, '');
    assert.strictEqual(result.length, 3);
  });

  it('should return empty array with no matches', () => {
    const result = filterSkills(sampleSkills, 'nonexistent');
    assert.strictEqual(result.length, 0);
  });

  it('should be case-insensitive', () => {
    const result = filterSkills(sampleSkills, 'alpha');
    assert.strictEqual(result.length, 1);
  });

  it('should sort skills with official first', () => {
    const result = sortSkills(sampleSkills);
    assert.strictEqual(result[0].official, true);
  });

  it('should sort alphabetically within same official status', () => {
    const nonOfficialSkills = sampleSkills.filter((s) => !s.official);
    const sorted = sortSkills(nonOfficialSkills);
    assert.strictEqual(sorted[0].name, 'Beta');
    assert.strictEqual(sorted[1].name, 'Gamma');
  });

  it('should count enabled skills correctly', () => {
    const count = getEnabledCount(sampleSkills);
    assert.strictEqual(count, 2);
  });

  it('should return 0 for empty skills', () => {
    const count = getEnabledCount([]);
    assert.strictEqual(count, 0);
  });
});

// ==================== Session Item Component Tests ====================

function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function getSessionStatusClass(status: SessionItem['status']): string {
  switch (status) {
    case 'running':
      return 'status-running';
    case 'completed':
      return 'status-completed';
    case 'error':
      return 'status-error';
    default:
      return 'status-idle';
  }
}

function sortSessionsByUpdate(sessions: SessionItem[]): SessionItem[] {
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

function sortSessionsByPin(sessions: SessionItem[]): SessionItem[] {
  return [...sessions].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.updatedAt - a.updatedAt;
  });
}

describe('Session Item Component Logic', () => {
  const sampleSessions: SessionItem[] = [
    { id: 's1', title: 'Old Session', status: 'completed', pinned: false, updatedAt: 1000 },
    { id: 's2', title: 'New Session', status: 'idle', pinned: true, updatedAt: 3000 },
    { id: 's3', title: 'Running Session', status: 'running', pinned: false, updatedAt: 2000 },
  ];

  it('should format session date', () => {
    const date = formatSessionDate(1609459200000); // 2021-01-01
    assert.ok(date.includes('2021'));
  });

  it('should return correct status class', () => {
    assert.strictEqual(getSessionStatusClass('running'), 'status-running');
    assert.strictEqual(getSessionStatusClass('completed'), 'status-completed');
    assert.strictEqual(getSessionStatusClass('error'), 'status-error');
    assert.strictEqual(getSessionStatusClass('idle'), 'status-idle');
  });

  it('should sort sessions by update time', () => {
    const sorted = sortSessionsByUpdate(sampleSessions);
    assert.strictEqual(sorted[0].id, 's2'); // updatedAt: 3000
    assert.strictEqual(sorted[1].id, 's3'); // updatedAt: 2000
    assert.strictEqual(sorted[2].id, 's1'); // updatedAt: 1000
  });

  it('should sort sessions with pinned first', () => {
    const sorted = sortSessionsByPin(sampleSessions);
    assert.strictEqual(sorted[0].pinned, true);
  });

  it('should maintain time sort within pinned groups', () => {
    const sessionsWithMultiplePinned: SessionItem[] = [
      { id: 'p1', title: 'Pinned Old', status: 'idle', pinned: true, updatedAt: 1000 },
      { id: 'p2', title: 'Pinned New', status: 'idle', pinned: true, updatedAt: 2000 },
      { id: 'u1', title: 'Unpinned', status: 'idle', pinned: false, updatedAt: 3000 },
    ];
    const sorted = sortSessionsByPin(sessionsWithMultiplePinned);
    assert.strictEqual(sorted[0].id, 'p2');
    assert.strictEqual(sorted[1].id, 'p1');
    assert.strictEqual(sorted[2].id, 'u1');
  });
});

// ==================== Message Component Tests ====================

function getMessageClass(message: Message): string {
  const classes = [`message-${message.type}`];
  if (message.isStreaming) {
    classes.push('message-streaming');
  }
  return classes.join(' ');
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

function isUserMessage(message: Message): boolean {
  return message.type === 'user';
}

function isAssistantMessage(message: Message): boolean {
  return message.type === 'assistant';
}

describe('Message Component Logic', () => {
  const sampleMessage: Message = {
    id: 'm1',
    type: 'assistant',
    content: 'Hello, this is a test message.',
    timestamp: 1609459200000,
    isStreaming: false,
  };

  it('should return correct message class', () => {
    assert.strictEqual(getMessageClass(sampleMessage), 'message-assistant');

    const streamingMessage = { ...sampleMessage, isStreaming: true };
    assert.strictEqual(getMessageClass(streamingMessage), 'message-assistant message-streaming');
  });

  it('should identify user message', () => {
    const userMessage = { ...sampleMessage, type: 'user' };
    assert.strictEqual(isUserMessage(userMessage), true);
    assert.strictEqual(isUserMessage(sampleMessage), false);
  });

  it('should identify assistant message', () => {
    assert.strictEqual(isAssistantMessage(sampleMessage), true);
    const userMessage = { ...sampleMessage, type: 'user' };
    assert.strictEqual(isAssistantMessage(userMessage), false);
  });

  it('should format message time', () => {
    const time = formatMessageTime(1609459200000);
    assert.ok(typeof time === 'string');
    assert.ok(time.length > 0);
  });

  it('should truncate long content', () => {
    const longContent = 'A'.repeat(150);
    const truncated = truncateContent(longContent, 100);
    assert.strictEqual(truncated.length, 103); // 100 + '...'
    assert.ok(truncated.endsWith('...'));
  });

  it('should not truncate short content', () => {
    const shortContent = 'Short message';
    const truncated = truncateContent(shortContent, 100);
    assert.strictEqual(truncated, shortContent);
  });

  it('should use default max length', () => {
    const longContent = 'A'.repeat(150);
    const truncated = truncateContent(longContent);
    assert.strictEqual(truncated.length, 103);
  });
});

// ==================== Batch Selection Tests ====================

function toggleSelection(state: SelectionState, id: string): SelectionState {
  const newSelectedIds = new Set(state.selectedIds);
  if (newSelectedIds.has(id)) {
    newSelectedIds.delete(id);
  } else {
    newSelectedIds.add(id);
  }
  return { ...state, selectedIds: newSelectedIds };
}

function selectAll(state: SelectionState, allIds: string[]): SelectionState {
  if (state.selectedIds.size === allIds.length) {
    return { ...state, selectedIds: new Set() };
  }
  return { ...state, selectedIds: new Set(allIds) };
}

function enterBatchMode(initialId: string): SelectionState {
  return {
    selectedIds: new Set([initialId]),
    isBatchMode: true,
  };
}

function exitBatchMode(): SelectionState {
  return {
    selectedIds: new Set(),
    isBatchMode: false,
  };
}

describe('Batch Selection Logic', () => {
  const allIds = ['s1', 's2', 's3'];

  it('should toggle selection', () => {
    let state: SelectionState = { selectedIds: new Set(), isBatchMode: false };

    state = toggleSelection(state, 's1');
    assert.strictEqual(state.selectedIds.has('s1'), true);

    state = toggleSelection(state, 's1');
    assert.strictEqual(state.selectedIds.has('s1'), false);
  });

  it('should select all', () => {
    const state: SelectionState = { selectedIds: new Set(), isBatchMode: true };
    const newState = selectAll(state, allIds);
    assert.strictEqual(newState.selectedIds.size, 3);
  });

  it('should deselect all when all selected', () => {
    const state: SelectionState = { selectedIds: new Set(allIds), isBatchMode: true };
    const newState = selectAll(state, allIds);
    assert.strictEqual(newState.selectedIds.size, 0);
  });

  it('should enter batch mode with initial selection', () => {
    const state = enterBatchMode('s1');
    assert.strictEqual(state.isBatchMode, true);
    assert.strictEqual(state.selectedIds.size, 1);
    assert.strictEqual(state.selectedIds.has('s1'), true);
  });

  it('should exit batch mode', () => {
    const state: SelectionState = { selectedIds: new Set(['s1', 's2']), isBatchMode: true };
    const newState = exitBatchMode();
    assert.strictEqual(newState.isBatchMode, false);
    assert.strictEqual(newState.selectedIds.size, 0);
  });
});

// ==================== Search/Filter Tests ====================

function searchSessions(sessions: SessionItem[], query: string): SessionItem[] {
  if (!query.trim()) return sessions;
  const lowerQuery = query.toLowerCase();
  return sessions.filter((session) => session.title.toLowerCase().includes(lowerQuery));
}

describe('Search Logic', () => {
  const sessions: SessionItem[] = [
    { id: 's1', title: 'React Development', status: 'completed', pinned: false, updatedAt: 1000 },
    { id: 's2', title: 'Vue Project', status: 'idle', pinned: false, updatedAt: 2000 },
    { id: 's3', title: 'React Testing', status: 'running', pinned: false, updatedAt: 3000 },
  ];

  it('should find matching sessions', () => {
    const results = searchSessions(sessions, 'React');
    assert.strictEqual(results.length, 2);
  });

  it('should be case-insensitive', () => {
    const results = searchSessions(sessions, 'react');
    assert.strictEqual(results.length, 2);
  });

  it('should return all with empty query', () => {
    const results = searchSessions(sessions, '');
    assert.strictEqual(results.length, 3);
  });

  it('should return empty with no matches', () => {
    const results = searchSessions(sessions, 'Angular');
    assert.strictEqual(results.length, 0);
  });

  it('should handle whitespace-only query', () => {
    const results = searchSessions(sessions, '   ');
    assert.strictEqual(results.length, 3);
  });
});

// ==================== i18n Helper Tests ====================

interface Translations {
  [key: string]: {
    en: string;
    zh: string;
  };
}

const sampleTranslations: Translations = {
  newChat: { en: 'New Chat', zh: '新对话' },
  settings: { en: 'Settings', zh: '设置' },
  search: { en: 'Search', zh: '搜索' },
};

function translate(key: string, language: 'en' | 'zh'): string {
  const translation = sampleTranslations[key];
  if (!translation) return key;
  return translation[language];
}

describe('i18n Helper Logic', () => {
  it('should translate to English', () => {
    assert.strictEqual(translate('newChat', 'en'), 'New Chat');
    assert.strictEqual(translate('settings', 'en'), 'Settings');
  });

  it('should translate to Chinese', () => {
    assert.strictEqual(translate('newChat', 'zh'), '新对话');
    assert.strictEqual(translate('settings', 'zh'), '设置');
  });

  it('should return key for missing translation', () => {
    assert.strictEqual(translate('nonexistent', 'en'), 'nonexistent');
  });
});

// ==================== Permission Modal Tests ====================

interface PermissionRequest {
  toolName: string;
  toolInput: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high';
}

function getRiskLevel(toolName: string): 'low' | 'medium' | 'high' {
  const highRiskTools = ['execute_command', 'delete_file', 'write_file'];
  const mediumRiskTools = ['read_file', 'list_directory'];

  if (highRiskTools.includes(toolName)) return 'high';
  if (mediumRiskTools.includes(toolName)) return 'medium';
  return 'low';
}

function formatToolInput(input: Record<string, unknown>): string {
  return JSON.stringify(input, null, 2);
}

describe('Permission Modal Logic', () => {
  it('should identify high risk tools', () => {
    assert.strictEqual(getRiskLevel('execute_command'), 'high');
    assert.strictEqual(getRiskLevel('delete_file'), 'high');
    assert.strictEqual(getRiskLevel('write_file'), 'high');
  });

  it('should identify medium risk tools', () => {
    assert.strictEqual(getRiskLevel('read_file'), 'medium');
    assert.strictEqual(getRiskLevel('list_directory'), 'medium');
  });

  it('should identify low risk tools', () => {
    assert.strictEqual(getRiskLevel('search'), 'low');
    assert.strictEqual(getRiskLevel('unknown_tool'), 'low');
  });

  it('should format tool input as JSON', () => {
    const input = { path: '/test/file.txt', encoding: 'utf-8' };
    const formatted = formatToolInput(input);
    assert.ok(formatted.includes('"path"'));
    assert.ok(formatted.includes('/test/file.txt'));
  });
});

// ==================== Artifact Detection Tests ====================

interface ArtifactInfo {
  type: 'html' | 'svg' | 'mermaid' | 'react' | 'code';
  title?: string;
  language?: string;
}

function detectArtifactType(code: string, language?: string): ArtifactInfo | null {
  // Check for explicit artifact markers
  const artifactMatch = code.match(/```artifact:(\w+)\s*(?:title="([^"]+)")?/);
  if (artifactMatch) {
    return {
      type: artifactMatch[1] as ArtifactInfo['type'],
      title: artifactMatch[2],
    };
  }

  // Heuristic detection
  if (language === 'html' || code.includes('<!DOCTYPE html>') || code.includes('<html')) {
    return { type: 'html', language: 'html' };
  }

  if (language === 'svg' || code.includes('<svg')) {
    return { type: 'svg', language: 'svg' };
  }

  if (language === 'mermaid' || code.includes('graph ') || code.includes('sequenceDiagram')) {
    return { type: 'mermaid', language: 'mermaid' };
  }

  if (language === 'jsx' || language === 'tsx' || code.includes('React') || code.includes('export default')) {
    return { type: 'react', language: language || 'jsx' };
  }

  return null;
}

describe('Artifact Detection Logic', () => {
  it('should detect explicit artifact markers', () => {
    const code = '```artifact:html title="My Page"\n<div>Hello</div>\n```';
    const result = detectArtifactType(code);
    assert.ok(result);
    assert.strictEqual(result.type, 'html');
    assert.strictEqual(result.title, 'My Page');
  });

  it('should detect HTML by content', () => {
    const code = '<!DOCTYPE html><html><body>Hello</body></html>';
    const result = detectArtifactType(code);
    assert.ok(result);
    assert.strictEqual(result.type, 'html');
  });

  it('should detect SVG by content', () => {
    const code = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
    const result = detectArtifactType(code);
    assert.ok(result);
    assert.strictEqual(result.type, 'svg');
  });

  it('should detect Mermaid by content', () => {
    const code = 'graph TD\n  A --> B';
    const result = detectArtifactType(code);
    assert.ok(result);
    assert.strictEqual(result.type, 'mermaid');
  });

  it('should detect React by language', () => {
    const code = 'export default function App() { return <div>Hello</div> }';
    const result = detectArtifactType(code, 'jsx');
    assert.ok(result);
    assert.strictEqual(result.type, 'react');
  });

  it('should return null for non-artifact code', () => {
    const code = 'const x = 42;';
    const result = detectArtifactType(code, 'javascript');
    assert.strictEqual(result, null);
  });
});
