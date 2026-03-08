import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import type { RequestContext } from '../index';

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

export function setupScheduledTaskRoutes(app: Router) {
  const router = Router();

  // GET /api/tasks - List all scheduled tasks
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore } = req.context as RequestContext;
      const tasks = scheduledTaskStore.listTasks();
      res.json({ success: true, tasks });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tasks',
      });
    }
  });

  // GET /api/tasks/:id - Get a specific task
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore } = req.context as RequestContext;
      const task = scheduledTaskStore.getTask(req.params.id);
      res.json({ success: true, task });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get task',
      });
    }
  });

  // POST /api/tasks - Create a new scheduled task
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore, coworkStore, scheduler } = req.context as RequestContext;
      const input = req.body;

      const coworkConfig = coworkStore.getConfig();
      const normalizedInput = input && typeof input === 'object' ? { ...input } : {};
      const candidateWorkingDirectory = typeof normalizedInput.workingDirectory === 'string' && normalizedInput.workingDirectory.trim()
        ? normalizedInput.workingDirectory
        : coworkConfig.workingDirectory;
      normalizedInput.workingDirectory = resolveExistingTaskWorkingDirectory(candidateWorkingDirectory);

      const task = scheduledTaskStore.createTask(normalizedInput);
      scheduler.reschedule();

      res.json({ success: true, task });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      });
    }
  });

  // PUT /api/tasks/:id - Update a scheduled task
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore, coworkStore, scheduler } = req.context as RequestContext;
      const { id } = req.params;
      const input = req.body;

      const existingTask = scheduledTaskStore.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ success: false, error: `Task not found: ${id}` });
      }

      const coworkConfig = coworkStore.getConfig();
      const normalizedInput = input && typeof input === 'object' ? { ...input } : {};
      const candidateWorkingDirectory = typeof normalizedInput.workingDirectory === 'string'
        ? (normalizedInput.workingDirectory.trim() || existingTask.workingDirectory || coworkConfig.workingDirectory)
        : (existingTask.workingDirectory || coworkConfig.workingDirectory);
      normalizedInput.workingDirectory = resolveExistingTaskWorkingDirectory(candidateWorkingDirectory);

      const task = scheduledTaskStore.updateTask(id, normalizedInput);
      scheduler.reschedule();

      res.json({ success: true, task });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task',
      });
    }
  });

  // DELETE /api/tasks/:id - Delete a scheduled task
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore, scheduler } = req.context as RequestContext;
      const { id } = req.params;

      scheduler.stopTask(id);
      const result = scheduledTaskStore.deleteTask(id);
      scheduler.reschedule();

      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete task',
      });
    }
  });

  // POST /api/tasks/:id/toggle - Toggle task enabled state
  router.post('/:id/toggle', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore, scheduler } = req.context as RequestContext;
      const { id } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameter: enabled (boolean) required',
        });
      }

      const { task, warning } = scheduledTaskStore.toggleTask(id, enabled);
      scheduler.reschedule();

      res.json({ success: true, task, warning });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle task',
      });
    }
  });

  // POST /api/tasks/:id/run - Manually run a task
  router.post('/:id/run', async (req: Request, res: Response) => {
    try {
      const { scheduler } = req.context as RequestContext;
      const { id } = req.params;

      scheduler.runManually(id).catch((err) => {
        console.error(`[API] Manual run failed for ${id}:`, err);
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run task',
      });
    }
  });

  // POST /api/tasks/:id/stop - Stop a running task
  router.post('/:id/stop', async (req: Request, res: Response) => {
    try {
      const { scheduler } = req.context as RequestContext;
      const { id } = req.params;

      const result = scheduler.stopTask(id);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop task',
      });
    }
  });

  // GET /api/tasks/:id/runs - List task run history
  router.get('/:id/runs', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore } = req.context as RequestContext;
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const runs = scheduledTaskStore.listRuns(id, limit, offset);
      res.json({ success: true, runs });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list runs',
      });
    }
  });

  // GET /api/tasks/:id/runs/count - Count task runs
  router.get('/:id/runs/count', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore } = req.context as RequestContext;
      const { id } = req.params;

      const count = scheduledTaskStore.countRuns(id);
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to count runs',
      });
    }
  });

  // GET /api/tasks/runs/all - List all runs across all tasks
  router.get('/runs/all', async (req: Request, res: Response) => {
    try {
      const { scheduledTaskStore } = req.context as RequestContext;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const runs = scheduledTaskStore.listAllRuns(limit, offset);
      res.json({ success: true, runs });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list all runs',
      });
    }
  });

  app.use('/api/tasks', router);
}
