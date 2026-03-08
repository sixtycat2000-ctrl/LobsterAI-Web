// Re-export types from renderer
export type {
  CoworkSession,
  CoworkSessionStatus,
  CoworkMessageType,
  CoworkConfig,
  CoworkExecutionMode,
  CoworkMessage,
} from '../../renderer/types/cowork';

// View types for navigation
export type ViewType = 'cowork' | 'settings' | 'skills' | 'mcp' | 'tasks';

// Web-specific types
export interface WebAppState {
  activeView: ViewType;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
}
