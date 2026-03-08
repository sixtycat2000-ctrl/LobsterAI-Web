import { Router, Request, Response } from 'express';
import type { RequestContext } from '../index';
import type { IMPlatform, IMGatewayConfig } from '../../src/main/im';

export function setupImRoutes(app: Router) {
  const router = Router();

  // GET /api/im/config - Get IM configuration
  router.get('/config', async (req: Request, res: Response) => {
    try {
      const { imGatewayManager } = req.context as RequestContext;
      const config = imGatewayManager.getConfig();
      res.json({ success: true, config });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get IM config',
      });
    }
  });

  // PUT /api/im/config - Set IM configuration
  router.put('/config', async (req: Request, res: Response) => {
    try {
      const { imGatewayManager } = req.context as RequestContext;
      const config = req.body as Partial<IMGatewayConfig>;
      imGatewayManager.setConfig(config);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set IM config',
      });
    }
  });

  // POST /api/im/gateways/:platform/start - Start an IM gateway
  router.post('/gateways/:platform/start', async (req: Request, res: Response) => {
    try {
      const { imGatewayManager } = req.context as RequestContext;
      const { platform } = req.params;

      // Validate platform
      const validPlatforms: IMPlatform[] = ['dingtalk', 'feishu', 'telegram', 'discord', 'nim', 'xiaomifeng', 'wecom'];
      if (!validPlatforms.includes(platform as IMPlatform)) {
        return res.status(400).json({
          success: false,
          error: `Invalid platform. Valid platforms: ${validPlatforms.join(', ')}`,
        });
      }

      // Persist enabled state
      imGatewayManager.setConfig({ [platform]: { enabled: true } });
      await imGatewayManager.startGateway(platform as IMPlatform);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start gateway',
      });
    }
  });

  // POST /api/im/gateways/:platform/stop - Stop an IM gateway
  router.post('/gateways/:platform/stop', async (req: Request, res: Response) => {
    try {
      const { imGatewayManager } = req.context as RequestContext;
      const { platform } = req.params;

      // Validate platform
      const validPlatforms: IMPlatform[] = ['dingtalk', 'feishu', 'telegram', 'discord', 'nim', 'xiaomifeng', 'wecom'];
      if (!validPlatforms.includes(platform as IMPlatform)) {
        return res.status(400).json({
          success: false,
          error: `Invalid platform. Valid platforms: ${validPlatforms.join(', ')}`,
        });
      }

      // Persist disabled state
      imGatewayManager.setConfig({ [platform]: { enabled: false } });
      await imGatewayManager.stopGateway(platform as IMPlatform);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop gateway',
      });
    }
  });

  // POST /api/im/gateways/:platform/test - Test an IM gateway connection
  router.post('/gateways/:platform/test', async (req: Request, res: Response) => {
    try {
      const { imGatewayManager } = req.context as RequestContext;
      const { platform } = req.params;
      const configOverride = req.body;

      // Validate platform
      const validPlatforms: IMPlatform[] = ['dingtalk', 'feishu', 'telegram', 'discord', 'nim', 'xiaomifeng', 'wecom'];
      if (!validPlatforms.includes(platform as IMPlatform)) {
        return res.status(400).json({
          success: false,
          error: `Invalid platform. Valid platforms: ${validPlatforms.join(', ')}`,
        });
      }

      const result = await imGatewayManager.testGateway(platform as IMPlatform, configOverride);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test gateway connectivity',
      });
    }
  });

  // GET /api/im/status - Get all IM gateways status
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const { imGatewayManager } = req.context as RequestContext;
      const status = imGatewayManager.getStatus();
      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get IM status',
      });
    }
  });

  app.use('/api/im', router);
}
