import { Router, Request, Response } from 'express';
import type { RequestContext } from '../src/index';

export function setupMcpRoutes(app: Router) {
  const router = Router();

  // GET /api/mcp/servers - List all MCP servers
  router.get('/servers', (req: Request, res: Response) => {
    try {
      const { mcpStore } = req.context as RequestContext;
      const servers = mcpStore.listServers();
      res.json({ success: true, servers });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list MCP servers',
      });
    }
  });

  // POST /api/mcp/servers - Create a new MCP server
  router.post('/servers', (req: Request, res: Response) => {
    try {
      const { mcpStore } = req.context as RequestContext;
      const data = req.body;
      mcpStore.createServer(data as any);
      const servers = mcpStore.listServers();
      res.json({ success: true, servers });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create MCP server',
      });
    }
  });

  // PATCH /api/mcp/servers/:id - Update an MCP server
  router.patch('/servers/:id', (req: Request, res: Response) => {
    try {
      const { mcpStore } = req.context as RequestContext;
      mcpStore.updateServer(req.params.id, req.body as any);
      const servers = mcpStore.listServers();
      res.json({ success: true, servers });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update MCP server',
      });
    }
  });

  // DELETE /api/mcp/servers/:id - Delete an MCP server
  router.delete('/servers/:id', (req: Request, res: Response) => {
    try {
      const { mcpStore } = req.context as RequestContext;
      mcpStore.deleteServer(req.params.id);
      const servers = mcpStore.listServers();
      res.json({ success: true, servers });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete MCP server',
      });
    }
  });

  // POST /api/mcp/servers/:id/enabled - Set MCP server enabled state
  router.post('/servers/:id/enabled', (req: Request, res: Response) => {
    try {
      const { mcpStore } = req.context as RequestContext;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameter: enabled (boolean) required',
        });
      }

      mcpStore.setEnabled(req.params.id, enabled);
      const servers = mcpStore.listServers();
      res.json({ success: true, servers });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update MCP server',
      });
    }
  });

  // GET /api/mcp/marketplace - Fetch MCP marketplace
  router.get('/marketplace', async (req: Request, res: Response) => {
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const url = isProd
        ? 'https://api-overmind.youdao.com/openapi/get/luna/hardware/lobsterai/prod/mcp-marketplace'
        : 'https://api-overmind.youdao.com/openapi/get/luna/hardware/lobsterai/test/mcp-marketplace';

      const https = await import('https');
      const data = await new Promise<string>((resolve, reject) => {
        const httpsRequest = https.get(url, { timeout: 10000 }, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            response.resume();
            return;
          }
          let body = '';
          response.setEncoding('utf8');
          response.on('data', (chunk: string) => { body += chunk; });
          response.on('end', () => resolve(body));
          response.on('error', reject);
        });
        httpsRequest.on('error', reject);
        httpsRequest.on('timeout', () => { httpsRequest.destroy(); reject(new Error('Request timeout')); });
      });

      const json = JSON.parse(data);
      const value = json?.data?.value;
      if (!value) {
        return res.status(500).json({ success: false, error: 'Invalid response: missing data.value' });
      }

      const marketplace = typeof value === 'string' ? JSON.parse(value) : value;
      res.json({ success: true, data: marketplace });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch marketplace',
      });
    }
  });

  app.use('/api/mcp', router);
}
