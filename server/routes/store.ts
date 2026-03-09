import { Router, Request, Response } from 'express';
import type { RequestContext } from '../src/index';

export function setupStoreRoutes(app: Router) {
  const router = Router();

  // GET /api/store/:key - Get a value from the store
  router.get('/:key', (req: Request, res: Response) => {
    try {
      const { store } = req.context as RequestContext;
      const value = store.get(req.params.key);
      res.json({ success: true, value });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get value',
      });
    }
  });

  // POST /api/store/:key - Set a value in the store
  router.post('/:key', (req: Request, res: Response) => {
    try {
      const { store } = req.context as RequestContext;
      store.set(req.params.key, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set value',
      });
    }
  });

  // DELETE /api/store/:key - Remove a value from the store
  router.delete('/:key', (req: Request, res: Response) => {
    try {
      const { store } = req.context as RequestContext;
      store.delete(req.params.key);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete value',
      });
    }
  });

  app.use('/api/store', router);
}
