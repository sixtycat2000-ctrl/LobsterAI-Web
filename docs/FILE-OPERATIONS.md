# File System Operations - Web Adaptation Guide

This document describes how to adapt Electron-specific file system operations for the web version of LobsterAI.

## Overview

The Electron version has direct access to the file system through Node.js APIs. The web version must work within browser security constraints, using:

1. **HTML5 File API** for user-selected files
2. **Download API** for saving files
3. **Server-side processing** for file operations requiring system access

---

## File Operations Mapping

| Electron Operation | Web Alternative | Server-Side Required |
|-------------------|-----------------|---------------------|
| `dialog:selectDirectory` | `<input webkitdirectory>` | No |
| `dialog:selectFile` | `<input type="file">` | No |
| `dialog:saveInlineFile` | Browser download | Yes |
| `dialog:readFileAsDataUrl` | FileReader API | No (local) / Yes (server path) |
| `shell:openPath` | `window.open()` or download | Yes |
| `shell:showItemInFolder` | Not supported | Yes (alternative: download) |
| `shell:openExternal` | `window.open(url, '_blank')` | No |
| `log:exportZip` | Download endpoint | Yes |
| Image capture/export | Canvas to download | Yes |
| `exportResultImage` | Canvas to download | Yes |

---

## 1. Directory Selection

### Electron Version

```typescript
const result = await window.electron.dialog.selectDirectory();
// result.path = "/Users/user/projects/my-project"
```

### Web Version

```typescript
// Use webkitdirectory attribute for directory selection
function selectDirectory(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Get relative path from first file
        const firstFile = files[0];
        const relativePath = firstFile.webkitRelativePath; // "my-project/file.txt"
        const directoryPath = relativePath.split('/').slice(0, -1).join('/');
        resolve(directoryPath);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

// Usage
const directory = await selectDirectory();
// Note: Browser only gives access to files IN the directory,
// not the directory path itself. Files must be processed individually.
```

### Server-Side Alternative

For operations that require actual server-side directory access:

```typescript
// Client: Manual path input (for server-side operations only)
const directoryPath = prompt("Enter server directory path:", "/Users/user/projects");

// Server: Validate and use the path
app.post('/api/file/validate-directory', authMiddleware, async (req, res) => {
  const { path: dirPath } = req.body;

  // Security: Validate path is within allowed directories
  if (!isPathAllowed(dirPath)) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  try {
    const stats = await fs.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Not a directory' });
    }
    res.json({ success: true, path: dirPath });
  } catch (error) {
    res.status(404).json({ error: 'Directory not found' });
  }
});
```

---

## 2. File Selection

### Electron Version

```typescript
const result = await window.electron.dialog.selectFile({
  title: 'Select an image',
  filters: [
    { name: 'Images', extensions: ['png', 'jpg', 'gif'] }
  ]
});
// result.path = "/Users/user/Pictures/image.png"
```

### Web Version

```typescript
function selectFile(options?: {
  accept?: string;  // MIME types or extensions like "image/png,.png"
  multiple?: boolean;
}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options?.accept) {
      input.accept = options.accept;
    }
    if (options?.multiple) {
      input.multiple = true;
    }

    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      resolve(files);
    };

    input.oncancel = () => resolve([]);
    input.click();
  });
}

// Usage: Select single image
const [file] = await selectFile({ accept: 'image/png,image/jpeg,image/gif' });

// Usage: Select multiple files
const files = await selectFile({ accept: '.txt,.md', multiple: true });
```

### File Upload to Server

```typescript
async function uploadFile(file: File): Promise<{ path: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/file/upload', {
    method: 'POST',
    headers: {
      'x-auth-token': getAuthToken(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}
```

---

## 3. File Downloads

### Electron Version

```typescript
// Save inline file (saves to disk)
await window.electron.dialog.saveInlineFile({
  dataBase64: 'data:image/png;base64,iVBORw0KG...',
  fileName: 'output.png',
  mimeType: 'image/png',
  cwd: workingDirectory
});
```

### Web Version

```typescript
// Client-side download (for generated content)
function downloadFile(dataBase64: string, fileName: string, mimeType: string) {
  // Extract base64 data if it has the prefix
  const base64Data = dataBase64.includes(',')
    ? dataBase64.split(',')[1]
    : dataBase64;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Usage
downloadFile(
  'data:image/png;base64,iVBORw0KG...',
  'output.png',
  'image/png'
);
```

### Server-Side Download Endpoint

```typescript
// Server endpoint for downloading server-generated files
app.get('/api/file/download', authMiddleware, async (req, res) => {
  const { path: filePath } = req.query;

  if (typeof filePath !== 'string') {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Security: Validate path
  if (!isPathAllowed(filePath)) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});
```

---

## 4. Reading Files

### Electron Version (Server Path)

```typescript
const result = await window.electron.dialog.readFileAsDataUrl('/path/to/file.png');
// result.dataUrl = "data:image/png;base64,iVBORw0KG..."
```

### Web Version (Local File - User Selected)

```typescript
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Usage
const file = await selectFile({ accept: 'image/*' });
const dataUrl = await readFileAsDataURL(file);
```

### Web Version (Server Path)

```typescript
// Client: Request file from server
async function readServerFile(filePath: string): Promise<string> {
  const response = await fetch(`/api/file/read?path=${encodeURIComponent(filePath)}`, {
    headers: {
      'x-auth-token': getAuthToken(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to read file');
  }

  const result = await response.json();
  return result.dataUrl;
}

// Server endpoint
app.get('/api/file/read', authMiddleware, async (req, res) => {
  const { path: filePath } = req.query;

  if (typeof filePath !== 'string') {
    return res.status(400).json({ error: 'Invalid path' });
  }

  if (!isPathAllowed(filePath)) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }

    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    res.json({ success: true, dataUrl });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});
```

---

## 5. Opening Files and URLs

### Electron Version

```typescript
// Open file with default application
await window.electron.shell.openPath('/path/to/document.pdf');

// Show file in folder
await window.electron.shell.showItemInFolder('/path/to/file.txt');

// Open URL in external browser
await window.electron.shell.openExternal('https://example.com');
```

### Web Version

```typescript
// Open URL in new tab
function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Download file (alternative to openPath)
function downloadServerFile(filePath: string, fileName?: string) {
  const link = document.createElement('a');
  link.href = `/api/file/download?path=${encodeURIComponent(filePath)}`;
  if (fileName) {
    link.download = fileName;
  }
  link.click();
}

// showItemInFolder: Not supported in web
// Alternative: Download the file or show a message
function showInFolderNotSupported() {
  alert('Showing file in folder is not supported in web version. Please download the file instead.');
}
```

---

## 6. Log Export

### Electron Version

```typescript
// Shows save dialog and exports zip to selected location
const result = await window.electron.log.exportZip();
```

### Web Version

```typescript
// Client: Trigger log download
async function exportLogs(): Promise<void> {
  const response = await fetch('/api/logs/export', {
    headers: {
      'x-auth-token': getAuthToken(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export logs');
  }

  // Get filename from header
  const contentDisposition = response.headers.get('Content-Disposition');
  const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
  const fileName = fileNameMatch?.[1] || 'logs.zip';

  // Download blob
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Server Endpoint

```typescript
import archiver from 'archiver';
import path from 'path';

app.get('/api/logs/export', authMiddleware, async (req, res) => {
  const logDirectory = getLogDirectory(); // Implement this
  const fileName = `lobsterai-logs-${Date.now()}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  // Add log files to archive
  archive.directory(logDirectory, false);

  await archive.finalize();
});
```

---

## 7. Image Capture and Export

### Electron Version

```typescript
// Capture screen region and save
const result = await window.electron.cowork.exportResultImage({
  rect: { x: 0, y: 0, width: 800, height: 600 },
  defaultFileName: 'capture.png'
});
```

### Web Version

```typescript
// Using html2canvas or similar library
import html2canvas from 'html2canvas';

async function captureElement(element: HTMLElement, fileName: string = 'capture.png') {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
  });

  // Convert to blob and download
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, 'image/png');
}

// Usage
const element = document.getElementById('capture-area');
if (element) {
  await captureElement(element, 'cowork-result.png');
}
```

---

## 8. Working Directory Handling

### Electron Version

```typescript
// Can use any system path
const cwd = '/Users/user/projects/my-project';
```

### Web Version

```typescript
// Web version has two options:

// Option 1: User-selected directory (files only)
interface WorkingDirectory {
  type: 'selected';
  name: string;  // Directory name only
  files: File[]; // Files from directory
}

// Option 2: Server-side path (for trusted environments)
interface ServerWorkingDirectory {
  type: 'server';
  path: string;  // Validated server path
}

// Usage
const workingDir: WorkingDirectory | ServerWorkingDirectory =
  await selectWorkingDirectory();

async function selectWorkingDirectory() {
  const choice = confirm('Use server-side directory? Cancel for file selection.');
  if (choice) {
    const path = prompt('Enter server directory path:');
    if (path && await validateServerPath(path)) {
      return { type: 'server', path };
    }
  } else {
    // Use file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    // ... handle file selection
  }
}
```

---

## 9. Security Considerations

### Path Validation

```typescript
// Server-side: Validate paths are within allowed directories
const ALLOWED_BASE_PATHS = [
  process.cwd(),
  '/Users/user/projects',  // User-configured
  os.homedir(),
];

function isPathAllowed(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const normalized = path.normalize(resolved);

  return ALLOWED_BASE_PATHS.some(basePath => {
    const resolvedBase = path.resolve(basePath);
    return normalized.startsWith(resolvedBase + path.sep) ||
           normalized === resolvedBase;
  });
}

// Prevent path traversal attacks
function sanitizePath(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  const normalized = path.normalize(resolved);

  // Check for path traversal
  if (inputPath.includes('..') || inputPath.includes('~')) {
    throw new Error('Invalid path');
  }

  return normalized;
}
```

### File Upload Validation

```typescript
import { extname, basename } from 'path';

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.md'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateUploadedFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large' };
  }

  // Check file name for suspicious patterns
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true };
}
```

---

## 10. Settings and Configuration Storage

### Electron Version

```typescript
// Stored in SQLite via ipcRenderer
await window.electron.store.set('key', value);
const value = await window.electron.store.get('key');
```

### Web Version

```typescript
// All storage remains on server side via HTTP API
const apiClient = {
  async get(key: string) {
    const response = await fetch(`/api/store/${key}`, {
      headers: { 'x-auth-token': getAuthToken() },
    });
    return response.json();
  },

  async set(key: string, value: unknown) {
    await fetch(`/api/store/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getAuthToken(),
      },
      body: JSON.stringify({ value }),
    });
  },

  async remove(key: string) {
    await fetch(`/api/store/${key}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': getAuthToken() },
    });
  },
};
```

---

## 11. Features Requiring Server-Side File Access

The following features MUST have server-side file access:

| Feature | Reason | Server Implementation |
|---------|--------|----------------------|
| Cowork working directory | Agent needs to read/write files | Use validated server paths |
| Skill file operations | Skills may read/write files | Sandbox with allowed paths |
| MCP filesystem server | Direct file system access | Server-side MCP only |
| Log export | Bundle multiple log files | Server generates zip |
| Scheduled task working dir | Tasks run in specific directories | Server-side path validation |

### Recommended Server Configuration

```typescript
// server/config/fileAccess.ts
export interface FileAccessConfig {
  allowedBasePaths: string[];
  maxUploadSize: number;
  allowedExtensions: string[];
  tempDirectory: string;
}

export const defaultFileAccessConfig: FileAccessConfig = {
  allowedBasePaths: [
    process.cwd(),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'projects'),
  ],
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.md'],
  tempDirectory: os.tmpdir(),
};
```

---

## 12. Client-Side Utility Module

Create a utility module for file operations:

```typescript
// src/renderer/utils/fileOperations.ts

export interface FileSelectOptions {
  accept?: string;
  multiple?: boolean;
}

export interface DirectorySelectResult {
  name: string;
  files: File[];
}

export class FileOperations {
  /**
   * Select a single file
   */
  static async selectFile(options?: FileSelectOptions): Promise<File | null> {
    const files = await this.selectFiles({ ...options, multiple: false });
    return files[0] || null;
  }

  /**
   * Select multiple files
   */
  static async selectFiles(options?: FileSelectOptions): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (options?.accept) input.accept = options.accept;
      if (options?.multiple) input.multiple = true;

      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        resolve(files);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  /**
   * Select a directory (webkitdirectory)
   */
  static async selectDirectory(): Promise<DirectorySelectResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;

      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length > 0) {
          const firstFile = files[0];
          const relativePath = firstFile.webkitRelativePath;
          const dirName = relativePath.split('/')[0];
          resolve({ name: dirName, files });
        } else {
          resolve(null);
        }
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  /**
   * Read file as data URL
   */
  static async readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Read file as text
   */
  static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Download a file from base64 data
   */
  static downloadFile(dataBase64: string, fileName: string, mimeType: string): void {
    const base64Data = dataBase64.includes(',')
      ? dataBase64.split(',')[1]
      : dataBase64;

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download a file from server
   */
  static async downloadServerFile(filePath: string, fileName?: string): Promise<void> {
    const url = `/api/file/download?path=${encodeURIComponent(filePath)}`;
    const link = document.createElement('a');
    link.href = url;
    if (fileName) link.download = fileName;
    link.click();
  }

  /**
   * Open external URL
   */
  static openExternal(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// React hook for file operations
export function useFileOperations() {
  return {
    selectFile: FileOperations.selectFile.bind(FileOperations),
    selectFiles: FileOperations.selectFiles.bind(FileOperations),
    selectDirectory: FileOperations.selectDirectory.bind(FileOperations),
    readFileAsDataURL: FileOperations.readFileAsDataURL.bind(FileOperations),
    readFileAsText: FileOperations.readFileAsText.bind(FileOperations),
    downloadFile: FileOperations.downloadFile.bind(FileOperations),
    downloadServerFile: FileOperations.downloadServerFile.bind(FileOperations),
    openExternal: FileOperations.openExternal.bind(FileOperations),
  };
}
```

---

## Summary

| Operation | Client Implementation | Server Required |
|-----------|---------------------|-----------------|
| Select directory | `<input webkitdirectory>` | No |
| Select file | `<input type="file">` | No |
| Save file | Download blob | Yes (for server files) |
| Read local file | FileReader | No |
| Read server file | HTTP GET | Yes |
| Open URL | `window.open()` | No |
| Show in folder | Not supported | N/A |
| Log export | Download endpoint | Yes |
| Working dir | File list or server path | Conditional |
| Settings | HTTP API | Yes |

The web version can provide most file functionality through browser APIs, with server-side support for operations requiring actual file system access.
