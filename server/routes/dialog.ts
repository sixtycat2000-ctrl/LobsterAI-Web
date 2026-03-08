import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// In web version, these endpoints provide alternatives to Electron's file dialogs
// The frontend will need to implement file selection UI using <input type="file">
// These endpoints provide server-side file operations for saving/uploaded files

const MAX_INLINE_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/json': '.json',
  'text/csv': '.csv',
};

const INVALID_FILE_NAME_PATTERN = /[<>:"/\\|?*\u0000-\u001F]/g;

const sanitizeAttachmentFileName = (value?: string): string => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return 'attachment';
  const fileName = path.basename(raw);
  const sanitized = fileName.replace(INVALID_FILE_NAME_PATTERN, ' ').replace(/\s+/g, ' ').trim();
  return sanitized || 'attachment';
};

const inferAttachmentExtension = (fileName: string, mimeType?: string): string => {
  const fromName = path.extname(fileName).toLowerCase();
  if (fromName) return fromName;
  if (typeof mimeType === 'string') {
    const normalized = mimeType.toLowerCase().split(';')[0].trim();
    return MIME_EXTENSION_MAP[normalized] ?? '';
  }
  return '';
};

const resolveInlineAttachmentDir = (userDataPath: string, cwd?: string): string => {
  const trimmed = typeof cwd === 'string' ? cwd.trim() : '';
  if (trimmed) {
    const resolved = path.resolve(trimmed);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return path.join(resolved, '.cowork-temp', 'attachments', 'manual');
    }
  }
  return path.join(userDataPath, 'attachments');
};

export function setupDialogRoutes(app: Router) {
  const router = Router();

  // GET /api/dialog/directory - Get working directory info
  // In web version, this returns info about a directory path for validation
  router.get('/directory', async (req: Request, res: Response) => {
    try {
      const { path: dirPath } = req.query;

      if (!dirPath || typeof dirPath !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Missing query parameter: path',
        });
      }

      const resolvedPath = path.resolve(dirPath);
      const exists = fs.existsSync(resolvedPath);
      const isDirectory = exists ? fs.statSync(resolvedPath).isDirectory() : false;

      res.json({
        success: true,
        path: resolvedPath,
        exists,
        isDirectory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check directory',
      });
    }
  });

  // POST /api/dialog/saveInlineFile - Save an uploaded file to disk
  router.post('/saveInlineFile', async (req: Request, res: Response) => {
    try {
      const { dataBase64, fileName, mimeType, cwd } = req.body;
      const userDataPath = req.app.get('userDataPath') as string;

      const dataBase64Str = typeof dataBase64 === 'string' ? dataBase64.trim() : '';
      if (!dataBase64Str) {
        return res.status(400).json({
          success: false,
          error: 'Missing file data',
        });
      }

      const buffer = Buffer.from(dataBase64Str, 'base64');
      if (!buffer.length) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file data',
        });
      }

      if (buffer.length > MAX_INLINE_ATTACHMENT_BYTES) {
        return res.status(413).json({
          success: false,
          error: `File too large (max ${Math.floor(MAX_INLINE_ATTACHMENT_BYTES / (1024 * 1024))}MB)`,
        });
      }

      const dir = resolveInlineAttachmentDir(userDataPath, cwd);
      await fs.promises.mkdir(dir, { recursive: true });

      const safeFileName = sanitizeAttachmentFileName(fileName);
      const extension = inferAttachmentExtension(safeFileName, mimeType);
      const baseName = extension ? safeFileName.slice(0, -extension.length) : safeFileName;
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const finalName = `${baseName || 'attachment'}-${uniqueSuffix}${extension}`;
      const outputPath = path.join(dir, finalName);

      await fs.promises.writeFile(outputPath, buffer);
      res.json({ success: true, path: outputPath });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save file',
      });
    }
  });

  // GET /api/dialog/readFileAsDataUrl - Read a file and return as data URL
  router.get('/readFileAsDataUrl', async (req: Request, res: Response) => {
    try {
      const { path: filePath } = req.query;

      if (typeof filePath !== 'string' || !filePath.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Missing query parameter: path',
        });
      }

      const MAX_READ_AS_DATA_URL_BYTES = 20 * 1024 * 1024;
      const MIME_BY_EXT: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
      };

      const resolvedPath = path.resolve(filePath.trim());
      const stat = await fs.promises.stat(resolvedPath);

      if (!stat.isFile()) {
        return res.status(400).json({
          success: false,
          error: 'Not a file',
        });
      }

      if (stat.size > MAX_READ_AS_DATA_URL_BYTES) {
        return res.status(413).json({
          success: false,
          error: `File too large (max ${Math.floor(MAX_READ_AS_DATA_URL_BYTES / (1024 * 1024))}MB)`,
        });
      }

      const buffer = await fs.promises.readFile(resolvedPath);
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeType = MIME_BY_EXT[ext] || 'application/octet-stream';
      const base64 = buffer.toString('base64');

      res.json({
        success: true,
        dataUrl: `data:${mimeType};base64,${base64}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      });
    }
  });

  // Note: dialog:selectDirectory and dialog:selectFile are Electron-specific
  // In web version, use HTML file input elements:
  // <input type="file" webkitdirectory directory> for directory selection
  // <input type="file"> for file selection

  app.use('/api/dialog', router);
}
