import { Router, Request, Response } from 'express';
import type { RequestContext } from '../src/index';
import { broadcastToAll } from '../websocket';

export function setupSkillsRoutes(app: Router) {
  const router = Router();

  // GET /api/skills - List all skills
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const skills = skillManager.listSkills();
      res.json({ success: true, skills });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load skills',
      });
    }
  });

  // POST /api/skills/set-enabled - Set skill enabled state
  router.post('/set-enabled', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const { id, enabled } = req.body;

      if (typeof id !== 'string' || typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters: id (string) and enabled (boolean) required',
        });
      }

      const skills = skillManager.setSkillEnabled(id, enabled);
      // Emit skills changed event via WebSocket
      broadcastToAll({
        type: 'skills:changed',
        data: { skills },
      });
      res.json({ success: true, skills });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update skill',
      });
    }
  });

  // DELETE /api/skills/:id - Delete a skill
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const skills = skillManager.deleteSkill(req.params.id);
      res.json({ success: true, skills });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete skill',
      });
    }
  });

  // POST /api/skills/download - Download a skill from source
  router.post('/download', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const { source } = req.body;

      if (typeof source !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameter: source (string) required',
        });
      }

      const result = await skillManager.downloadSkill(source);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download skill',
      });
    }
  });

  // GET /api/skills/root - Get skills root directory path
  router.get('/root', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const root = skillManager.getSkillsRoot();
      res.json({ success: true, path: root });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve skills root',
      });
    }
  });

  // GET /api/skills/autoRoutingPrompt - Get auto-routing prompt
  router.get('/autoRoutingPrompt', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const prompt = skillManager.buildAutoRoutingPrompt();
      res.json({ success: true, prompt });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build auto-routing prompt',
      });
    }
  });

  // GET /api/skills/:skillId/config - Get skill config
  router.get('/:skillId/config', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const result = skillManager.getSkillConfig(req.params.skillId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get skill config',
      });
    }
  });

  // PUT /api/skills/:skillId/config - Set skill config
  router.put('/:skillId/config', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const config = req.body;
      const result = skillManager.setSkillConfig(req.params.skillId, config);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set skill config',
      });
    }
  });

  // POST /api/skills/:skillId/testEmail - Test email connectivity
  router.post('/:skillId/testEmail', async (req: Request, res: Response) => {
    try {
      const { skillManager } = req.context as RequestContext;
      const config = req.body;
      const result = await skillManager.testEmailConnectivity(req.params.skillId, config);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test email connectivity',
      });
    }
  });

  app.use('/api/skills', router);
}
