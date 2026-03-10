import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import type { RequestContext, CoworkSessionId } from '../src/index';
import { probeCoworkModelReadiness, generateSessionTitle } from '../../src/main/libs/coworkUtil';
import type { PermissionResult } from '@anthropic-ai/claude-agent-sdk';

// Type for provider config
interface ProviderModel {
  id: string;
}

interface ProviderConfig {
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
  apiFormat?: 'anthropic' | 'openai' | 'native';
  models?: ProviderModel[];
}

// Constants
const MIN_MEMORY_USER_MEMORIES_MAX_ITEMS = 1;
const MAX_MEMORY_USER_MEMORIES_MAX_ITEMS = 60;

// Utility to resolve task working directory
const resolveTaskWorkingDirectory = (workspaceRoot: string): string => {
  const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
  fs.mkdirSync(resolvedWorkspaceRoot, { recursive: true });
  if (!fs.statSync(resolvedWorkspaceRoot).isDirectory()) {
    throw new Error(`Selected workspace is not a directory: ${resolvedWorkspaceRoot}`);
  }
  return resolvedWorkspaceRoot;
};

const resolveExistingTaskWorkingDirectory = (workspaceRoot: string): string => {
  const trimmed = workspaceRoot.trim();
  if (!trimmed) {
    throw new Error('Please select a task folder before submitting.');
  }
  const resolvedWorkspaceRoot = path.resolve(trimmed);
  if (!fs.existsSync(resolvedWorkspaceRoot) || !fs.statSync(resolvedWorkspaceRoot).isDirectory()) {
    throw new Error(`Task folder does not exist or is not a directory: ${resolvedWorkspaceRoot}`);
  }
  return resolvedWorkspaceRoot;
};

export function setupCoworkRoutes(app: Router) {
  const router = Router();

  // ==================== Session Management ====================

  // POST /api/cowork/sessions - Start a new cowork session
  router.post('/sessions', async (req: Request, res: Response) => {
    const timings: { step: string; ms: number }[] = [];
    const startTime = Date.now();
    const markTime = (step: string) => {
      timings.push({ step, ms: Date.now() - startTime });
      console.log(`[PERF] /sessions ${step}: ${Date.now() - startTime}ms`);
    };
    markTime('request_start');

    try {
      const { coworkStore, coworkRunner } = req.context as RequestContext;
      const {
        prompt,
        cwd,
        systemPrompt,
        title,
        activeSkillIds,
        imageAttachments,
      } = req.body;

      const config = coworkStore.getConfig();
      const resolvedSystemPrompt = systemPrompt ?? config.systemPrompt;
      const selectedWorkspaceRoot = (cwd || config.workingDirectory || '').trim();

      if (!selectedWorkspaceRoot) {
        return res.status(400).json({
          success: false,
          error: 'Please select a task folder before submitting.',
        });
      }

      const fallbackTitle = (prompt as string)?.split('\n')[0]?.slice(0, 50) || 'New Session';
      const sessionTitle = title?.trim() || fallbackTitle;
      const taskWorkingDirectory = resolveTaskWorkingDirectory(selectedWorkspaceRoot);

      const session = coworkStore.createSession(
        sessionTitle,
        taskWorkingDirectory,
        resolvedSystemPrompt,
        config.executionMode || 'local',
        activeSkillIds || []
      );

      // Build metadata, include imageAttachments if present
      const messageMetadata: Record<string, unknown> = {};
      if (activeSkillIds?.length) {
        messageMetadata.skillIds = activeSkillIds;
      }
      if (imageAttachments?.length) {
        messageMetadata.imageAttachments = imageAttachments;
      }

      coworkStore.addMessage(session.id, {
        type: 'user',
        content: prompt,
        metadata: Object.keys(messageMetadata).length > 0 ? messageMetadata : undefined,
      });
      markTime('message_added');

      markTime('before_probe');
      const probe = await probeCoworkModelReadiness();
      markTime('after_probe');
      if (probe.ok === false) {
        coworkStore.updateSession(session.id, { status: 'error' });
        coworkStore.addMessage(session.id, {
          type: 'system',
          content: `Error: ${probe.error}`,
          metadata: { error: probe.error },
        });
        const failedSession = coworkStore.getSession(session.id) || {
          ...session,
          status: 'error' as const,
        };
        return res.json({ success: true, session: failedSession });
      }

      // Update session status to 'running' before starting async task
      coworkStore.updateSession(session.id, { status: 'running' });
      markTime('status_updated');

      // Start the session asynchronously (fire and forget)
      // Use Promise.resolve().then() to ensure truly async execution without awaiting
      markTime('before_startSession');
      Promise.resolve().then(() => {
        coworkRunner.startSession(session.id, prompt, {
          skipInitialUserMessage: true,
          skillIds: activeSkillIds,
          workspaceRoot: selectedWorkspaceRoot,
          confirmationMode: 'modal',
          imageAttachments,
        }).catch((error) => {
          console.error('Cowork session error:', error);
          console.error('Cowork session error type:', typeof error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
          if (error && typeof error === 'object') {
            console.error('Error keys:', Object.keys(error));
            for (const key of Object.keys(error)) {
              console.error(`  ${key}:`, (error as any)[key]);
            }
          }
        });
      });
      markTime('after_startSession_call');

      const sessionWithMessages = coworkStore.getSession(session.id) || {
        ...session,
        status: 'running' as const,
      };
      markTime('before_response');
      res.json({ success: true, session: sessionWithMessages });
      markTime('response_sent');
      console.log('[PERF] /sessions timings:', JSON.stringify(timings));
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start session',
      });
    }
  });

  // POST /api/cowork/sessions/:sessionId/continue - Continue a session
  router.post('/sessions/:sessionId/continue', async (req: Request, res: Response) => {
    try {
      const { coworkRunner, coworkStore } = req.context as RequestContext;
      const { sessionId } = req.params;
      const { prompt, systemPrompt, activeSkillIds, imageAttachments } = req.body;

      // Start continuation asynchronously (fire and forget)
      Promise.resolve().then(() => {
        coworkRunner.continueSession(sessionId as CoworkSessionId, prompt, {
          systemPrompt,
          skillIds: activeSkillIds,
          imageAttachments,
        }).catch((error) => {
          console.error('Cowork continue error:', error);
        });
      });

      const session = coworkStore.getSession(sessionId as CoworkSessionId);
      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to continue session',
      });
    }
  });

  // POST /api/cowork/sessions/:sessionId/stop - Stop a session
  router.post('/sessions/:sessionId/stop', async (req: Request, res: Response) => {
    try {
      const { coworkRunner } = req.context as RequestContext;
      coworkRunner.stopSession(req.params.sessionId as CoworkSessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop session',
      });
    }
  });

  // DELETE /api/cowork/sessions/:sessionId - Delete a session
  router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      coworkStore.deleteSession(req.params.sessionId as CoworkSessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session',
      });
    }
  });

  // PATCH /api/cowork/sessions/:sessionId/pin - Set session pinned state
  router.patch('/sessions/:sessionId/pin', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const { pinned } = req.body;

      if (typeof pinned !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameter: pinned (boolean) required',
        });
      }

      coworkStore.setSessionPinned(req.params.sessionId as CoworkSessionId, pinned);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session pin',
      });
    }
  });

  // PATCH /api/cowork/sessions/:sessionId - Rename session
  router.patch('/sessions/:sessionId', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const { title } = req.body;

      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameter: title (non-empty string) required',
        });
      }

      coworkStore.updateSession(req.params.sessionId as CoworkSessionId, { title: title.trim() });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rename session',
      });
    }
  });

  // GET /api/cowork/sessions/:sessionId - Get a session
  router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const session = coworkStore.getSession(req.params.sessionId as CoworkSessionId);
      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session',
      });
    }
  });

  // GET /api/cowork/sessions - List all sessions
  router.get('/sessions', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const sessions = coworkStore.listSessions();
      res.json({ success: true, sessions });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list sessions',
      });
    }
  });

  // ==================== Configuration ====================

  // GET /api/cowork/config - Get cowork configuration
  router.get('/config', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const config = coworkStore.getConfig();
      res.json({ success: true, config });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get config',
      });
    }
  });

  // PUT /api/cowork/config - Set cowork configuration
  router.put('/config', async (req: Request, res: Response) => {
    try {
      const { coworkStore, skillManager } = req.context as RequestContext;
      const config = req.body;

      const normalizedExecutionMode = config.executionMode;
      const normalizedMemoryEnabled = typeof config.memoryEnabled === 'boolean'
        ? config.memoryEnabled
        : undefined;
      const normalizedMemoryImplicitUpdateEnabled = typeof config.memoryImplicitUpdateEnabled === 'boolean'
        ? config.memoryImplicitUpdateEnabled
        : undefined;
      const normalizedMemoryLlmJudgeEnabled = typeof config.memoryLlmJudgeEnabled === 'boolean'
        ? config.memoryLlmJudgeEnabled
        : undefined;
      const normalizedMemoryGuardLevel = config.memoryGuardLevel === 'strict'
        || config.memoryGuardLevel === 'standard'
        || config.memoryGuardLevel === 'relaxed'
        ? config.memoryGuardLevel
        : undefined;
      const normalizedMemoryUserMemoriesMaxItems =
        typeof config.memoryUserMemoriesMaxItems === 'number' && Number.isFinite(config.memoryUserMemoriesMaxItems)
          ? Math.max(
            MIN_MEMORY_USER_MEMORIES_MAX_ITEMS,
            Math.min(MAX_MEMORY_USER_MEMORIES_MAX_ITEMS, Math.floor(config.memoryUserMemoriesMaxItems))
          )
        : undefined;
      const normalizedConfig = {
        ...config,
        executionMode: normalizedExecutionMode,
        memoryEnabled: normalizedMemoryEnabled,
        memoryImplicitUpdateEnabled: normalizedMemoryImplicitUpdateEnabled,
        memoryLlmJudgeEnabled: normalizedMemoryLlmJudgeEnabled,
        memoryGuardLevel: normalizedMemoryGuardLevel,
        memoryUserMemoriesMaxItems: normalizedMemoryUserMemoriesMaxItems,
      };

      const previousWorkingDir = coworkStore.getConfig().workingDirectory;
      coworkStore.setConfig(normalizedConfig);

      if (normalizedConfig.workingDirectory !== undefined && normalizedConfig.workingDirectory !== previousWorkingDir) {
        skillManager.handleWorkingDirectoryChange();
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set config',
      });
    }
  });

  // ==================== Permissions ====================

  // POST /api/cowork/permissions/:requestId/respond - Respond to a permission request
  router.post('/permissions/:requestId/respond', async (req: Request, res: Response) => {
    try {
      const { coworkRunner } = req.context as RequestContext;
      const { requestId } = req.params;
      const { result } = req.body;

      coworkRunner.respondToPermission(requestId, result as PermissionResult);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to respond to permission',
      });
    }
  });

  // ==================== Memory ====================

  // GET /api/cowork/memory/entries - List memory entries
  router.get('/memory/entries', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const { query, status, includeDeleted, limit, offset } = req.query;

      const entries = coworkStore.listUserMemories({
        query: typeof query === 'string' ? query.trim() : undefined,
        status: (status as 'created' | 'stale' | 'deleted' | 'all') || 'all',
        includeDeleted: includeDeleted === 'true',
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({ success: true, entries });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list memory entries',
      });
    }
  });

  // POST /api/cowork/memory/entries - Create a memory entry
  router.post('/memory/entries', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const { text, confidence, isExplicit } = req.body;

      const entry = coworkStore.createUserMemory({
        text,
        confidence,
        isExplicit,
      });

      res.json({ success: true, entry });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create memory entry',
      });
    }
  });

  // PUT /api/cowork/memory/entries/:id - Update a memory entry
  router.put('/memory/entries/:id', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const { id } = req.params;
      const { text, confidence, status, isExplicit } = req.body;

      const entry = coworkStore.updateUserMemory({
        id,
        text,
        confidence,
        status,
        isExplicit,
      });

      if (!entry) {
        return res.status(404).json({ success: false, error: 'Memory entry not found' });
      }

      res.json({ success: true, entry });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update memory entry',
      });
    }
  });

  // DELETE /api/cowork/memory/entries/:id - Delete a memory entry
  router.delete('/memory/entries/:id', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const success = coworkStore.deleteUserMemory(req.params.id);

      res.json(success ? { success: true } : { success: false, error: 'Memory entry not found' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete memory entry',
      });
    }
  });

  // GET /api/cowork/memory/stats - Get memory statistics
  router.get('/memory/stats', async (req: Request, res: Response) => {
    try {
      const { coworkStore } = req.context as RequestContext;
      const stats = coworkStore.getUserMemoryStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get memory stats',
      });
    }
  });

 // ==================== Utilities ====================  // POST /api/cowork/generateTitle - Generate session title
  router.post('/generateTitle', async (req: Request, res: Response) => {
    const { userInput } = req.body;
    const result = await generateSessionTitle(userInput || null);
    res.json(result);
  });

  // GET /api/cowork/recentCwds - Get recent working directories
  router.get('/recentCwds', async (req: Request, res: Response) => {
    const { coworkStore } = req.context as RequestContext;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const boundedLimit = Math.min(Math.max(limit, 1), 20);
    const cwds = coworkStore.listRecentCwds(boundedLimit);
    res.json(cwds);
  });

  // ==================== API Config ====================

  // GET /api/cowork/api-config - Get API configuration
  router.get('/api-config', async (req: Request, res: Response) => {
    try {
      const { store } = req.context as RequestContext;
      const appConfig = store.get<any>('app_config');
      if (!appConfig?.providers) {
        return res.json({ success: true, data: null });
      }

      // Return a simplified API config
      const defaultProvider = appConfig.model?.defaultModelProvider;
      const defaultModel = appConfig.model?.defaultModel;
      const providers = appConfig.providers || {};

      // Find the active provider
      let activeProvider: (ProviderConfig & { name: string }) | null = null;
      const defaultProviderConfig = providers[defaultProvider] as ProviderConfig | undefined;
      if (defaultProvider && defaultProviderConfig?.enabled) {
        activeProvider = { name: defaultProvider, ...defaultProviderConfig };
      } else {
        // Find first enabled provider
        for (const [name, config] of Object.entries(providers)) {
          const c = config as ProviderConfig;
          if (c?.enabled) {
            activeProvider = { name, ...c };
            break;
          }
        }
      }

      if (!activeProvider) {
        return res.json({ success: true, data: null });
      }

      const apiConfig = {
        apiKey: activeProvider.apiKey || '',
        baseURL: activeProvider.baseUrl || '',
        model: defaultModel || activeProvider.models?.[0]?.id || '',
        apiType: activeProvider.apiFormat === 'anthropic' ? 'anthropic' : 'openai' as const,
      };

      res.json({ success: true, data: apiConfig });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get API config',
      });
    }
  });

  // GET /api/cowork/api-config/check - Check if API configuration is valid
  router.get('/api-config/check', async (req: Request, res: Response) => {
    try {
      const { store } = req.context as RequestContext;
      const appConfig = store.get<any>('app_config');

      if (!appConfig?.providers) {
        return res.json({
          success: true,
          data: { hasConfig: false, config: null, error: 'No providers configured' },
        });
      }

      const providers = appConfig.providers || {};
      const defaultProvider = appConfig.model?.defaultModelProvider;
      const defaultModel = appConfig.model?.defaultModel;

      // Find the active provider
      let activeProvider: ProviderConfig | null = null;
      let activeProviderName: string | null = null;
      const providerConfig = providers[defaultProvider] as ProviderConfig | undefined;
      if (defaultProvider && providerConfig?.enabled) {
        activeProvider = providerConfig;
        activeProviderName = defaultProvider;
      } else {
        for (const [name, config] of Object.entries(providers)) {
          const pc = config as ProviderConfig;
          if (pc?.enabled) {
            activeProvider = pc;
            activeProviderName = name;
            break;
          }
        }
      }

      if (!activeProvider) {
        return res.json({
          success: true,
          data: { hasConfig: false, config: null, error: 'No enabled provider found' },
        });
      }

      const hasApiKey = Boolean(activeProvider.apiKey?.trim());
      const hasBaseUrl = Boolean(activeProvider.baseUrl?.trim());
      const hasModel = Boolean(defaultModel || activeProvider.models?.length);

      const apiConfig = {
        apiKey: activeProvider.apiKey || '',
        baseURL: activeProvider.baseUrl || '',
        model: defaultModel || activeProvider.models?.[0]?.id || '',
        apiType: activeProvider.apiFormat === 'anthropic' ? 'anthropic' : 'openai' as const,
      };

      // Basic validation
      const errors: string[] = [];
      if (activeProviderName !== 'ollama' && !hasApiKey) {
        errors.push('API key is required');
      }
      if (!hasBaseUrl) {
        errors.push('Base URL is required');
      }
      if (!hasModel) {
        errors.push('No model configured');
      }

      res.json({
        success: true,
        data: {
          hasConfig: errors.length === 0,
          config: apiConfig,
          error: errors.length > 0 ? errors.join(', ') : undefined,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check API config',
      });
    }
  });

  // PUT /api/cowork/api-config - Save API configuration
  router.put('/api-config', async (req: Request, res: Response) => {
    try {
      const { store } = req.context as RequestContext;
      const { apiKey, baseURL, model, apiType } = req.body;

      // Get existing config
      const appConfig = store.get<any>('app_config') || {};

      // Update the config
      const providers = appConfig.providers || {};
      const defaultProvider = appConfig.model?.defaultModelProvider || 'anthropic';

      if (!providers[defaultProvider]) {
        providers[defaultProvider] = { enabled: true, apiKey: '', baseUrl: '', models: [] };
      }

      providers[defaultProvider].apiKey = apiKey || providers[defaultProvider].apiKey;
      providers[defaultProvider].baseUrl = baseURL || providers[defaultProvider].baseUrl;
      providers[defaultProvider].apiFormat = apiType || providers[defaultProvider].apiFormat;

      if (!providers[defaultProvider].models?.some((m: any) => m.id === model)) {
        providers[defaultProvider].models = [{ id: model }];
      }

      appConfig.providers = providers;
      appConfig.model = { ...appConfig.model, defaultModel: model };

      store.set('app_config', appConfig);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save API config',
      });
    }
  });

  // POST /api/cowork/generate-title - Generate session title from user input
  router.post('/generate-title', async (req: Request, res: Response) => {
    try {
      const { userInput } = req.body;

      // Call generateSessionTitle with the user input
      const title = await generateSessionTitle(userInput || null);
      res.json({ title });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate title',
      });
    }
  });

  app.use('/api/cowork', router);
}
