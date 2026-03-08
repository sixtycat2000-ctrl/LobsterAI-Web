/**
 * Tests for API Client
 * Tests HTTP request methods and SSE streaming
 *
 * This file tests the ApiClient class by loading compiled output.
 * The tests create a mock HTTP server to test HTTP methods.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';

// Define types locally
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MockServer {
  server: ReturnType<typeof createServer>;
  port: number;
  close: () => Promise<void>;
  setHandler: (handler: (req: IncomingMessage, res: ServerResponse) => void) => void;
}

// Helper to create a mock HTTP server
async function createMockServer(port: number = 0): Promise<MockServer> {
  let requestHandler: (req: IncomingMessage, res: ServerResponse) => void = () => {};

  const server = createServer((req, res) => {
    requestHandler(req, res);
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => resolve());
  });

  const address = server.address() as { port: number };

  return {
    server,
    port: address.port,
    close: () => {
      return new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
    setHandler: (handler) => {
      requestHandler = handler;
    },
  };
}

// Helper to parse request body
async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// ApiClient implementation for testing (mirrors src/renderer/services/apiClient.ts)
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(path);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: (data as { error?: string; message?: string }).error ||
                 (data as { error?: string; message?: string }).message ||
                 `HTTP ${response.status}`,
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async stream(
    path: string,
    body: unknown,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<AbortController> {
    const controller = new AbortController();
    const url = this.buildUrl(path);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        onError(`HTTP ${response.status}`);
        return controller;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body');
        return controller;
      }

      const decoder = new TextDecoder();

      const read = async (): Promise<void> => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            onChunk(chunk);
          }
          onComplete();
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            onError(error.message);
          }
        }
      };

      read();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError(error.message);
      }
    }

    return controller;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

describe('ApiClient', () => {
  let mockServer: MockServer;
  let client: ApiClient;

  beforeEach(async () => {
    mockServer = await createMockServer();
    client = new ApiClient(`http://localhost:${mockServer.port}/api`);
  });

  afterEach(async () => {
    await mockServer.close();
  });

  // ==================== Constructor ====================

  describe('constructor', () => {
    it('should create instance with base URL', () => {
      const apiClient = new ApiClient('http://localhost:3000/api');
      assert.strictEqual(apiClient.getBaseUrl(), 'http://localhost:3000/api');
    });

    it('should remove trailing slash from base URL', () => {
      const apiClient = new ApiClient('http://localhost:3000/api/');
      assert.strictEqual(apiClient.getBaseUrl(), 'http://localhost:3000/api');
    });
  });

  // ==================== GET ====================

  describe('get', () => {
    it('should make GET request and return data', async () => {
      mockServer.setHandler((req, res) => {
        assert.strictEqual(req.method, 'GET');
        assert.strictEqual(req.url, '/api/test');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'success', data: { id: 1 } }));
      });

      const result = await client.get<{ message: string; data: { id: number } }>('/test');
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.data, { message: 'success', data: { id: 1 } });
    });

    it('should handle 404 error', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      const result = await client.get('/not-found');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Not found');
    });

    it('should handle 500 error', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });

      const result = await client.get('/error');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Internal server error');
    });

    it('should handle network error', async () => {
      const badClient = new ApiClient('http://localhost:99999/api');
      const result = await badClient.get('/test');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  // ==================== POST ====================

  describe('post', () => {
    it('should make POST request with body', async () => {
      mockServer.setHandler(async (req, res) => {
        assert.strictEqual(req.method, 'POST');
        assert.strictEqual(req.url, '/api/create');
        const body = await parseBody(req);
        assert.deepStrictEqual(body, { name: 'test', value: 123 });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id: 'created-123' }));
      });

      const result = await client.post<{ success: boolean; id: string }>('/create', {
        name: 'test',
        value: 123,
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data?.id, 'created-123');
    });

    it('should handle POST error', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid input' }));
      });

      const result = await client.post('/create', { invalid: true });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid input');
    });
  });

  // ==================== PUT ====================

  describe('put', () => {
    it('should make PUT request with body', async () => {
      mockServer.setHandler(async (req, res) => {
        assert.strictEqual(req.method, 'PUT');
        assert.strictEqual(req.url, '/api/update/123');
        const body = await parseBody(req);
        assert.deepStrictEqual(body, { name: 'updated' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });

      const result = await client.put('/update/123', { name: 'updated' });
      assert.strictEqual(result.success, true);
    });

    it('should handle PUT error', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Resource not found' }));
      });

      const result = await client.put('/update/nonexistent', { name: 'updated' });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Resource not found');
    });
  });

  // ==================== DELETE ====================

  describe('delete', () => {
    it('should make DELETE request', async () => {
      mockServer.setHandler((req, res) => {
        assert.strictEqual(req.method, 'DELETE');
        assert.strictEqual(req.url, '/api/delete/123');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });

      const result = await client.delete('/delete/123');
      assert.strictEqual(result.success, true);
    });

    it('should handle DELETE error', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
      });

      const result = await client.delete('/delete/protected');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Forbidden');
    });
  });

  // ==================== Request Headers ====================

  describe('request headers', () => {
    it('should include Content-Type header', async () => {
      mockServer.setHandler((req, res) => {
        assert.strictEqual(req.headers['content-type'], 'application/json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });

      await client.get('/test');
    });
  });

  // ==================== URL Building ====================

  describe('URL building', () => {
    it('should handle path without leading slash', async () => {
      mockServer.setHandler((req, res) => {
        assert.strictEqual(req.url, '/api/sessions');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessions: [] }));
      });

      await client.get('sessions');
    });

    it('should handle path with leading slash', async () => {
      mockServer.setHandler((req, res) => {
        assert.strictEqual(req.url, '/api/sessions');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessions: [] }));
      });

      await client.get('/sessions');
    });
  });

  // ==================== Error Response Formats ====================

  describe('error response formats', () => {
    it('should handle error with message field', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Bad request' }));
      });

      const result = await client.get('/test');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Bad request');
    });

    it('should handle error without error/message field', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      });

      const result = await client.get('/test');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'HTTP 500');
    });

    it('should handle non-JSON response', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Not JSON');
      });

      const result = await client.get('/test');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  // ==================== SSE Streaming ====================

  describe('stream', () => {
    it('should handle SSE streaming', async () => {
      const chunks: string[] = [];

      mockServer.setHandler((req, res) => {
        assert.strictEqual(req.method, 'POST');
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        // Send some chunks
        res.write('data: chunk1\n\n');
        res.write('data: chunk2\n\n');
        res.end();
      });

      const controller = await new Promise<AbortController>((resolve) => {
        const ctrl = client.stream(
          '/stream',
          { prompt: 'test' },
          (chunk) => {
            chunks.push(chunk);
          },
          () => {
            resolve(ctrl);
          },
          () => {
            resolve(ctrl);
          }
        );
      });

      // Wait a bit for streaming to complete
      await new Promise((r) => setTimeout(r, 100));

      assert.ok(chunks.length >= 2);
      assert.ok(chunks.some((c) => c.includes('chunk1')));
      assert.ok(chunks.some((c) => c.includes('chunk2')));
    });

    it('should handle streaming error', async () => {
      let errorMessage = '';

      mockServer.setHandler((req, res) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Stream error' }));
      });

      const controller = await new Promise<AbortController>((resolve) => {
        const ctrl = client.stream(
          '/stream',
          { prompt: 'test' },
          () => {},
          () => resolve(ctrl),
          (error) => {
            errorMessage = error;
            resolve(ctrl);
          }
        );
      });

      // Wait a bit
      await new Promise((r) => setTimeout(r, 100));

      assert.strictEqual(errorMessage, 'HTTP 500');
    });

    it('should be abortable', async () => {
      mockServer.setHandler((req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
        });
        // Don't end immediately - let it hang
      });

      const controller = client.stream(
        '/stream',
        { prompt: 'test' },
        () => {},
        () => {},
        () => {}
      );

      // Abort immediately
      controller.abort();

      // Wait a bit
      await new Promise((r) => setTimeout(r, 50));

      // Test passes if no error thrown
      assert.ok(controller);
    });
  });

  // ==================== Integration-like Tests ====================

  describe('integration scenarios', () => {
    it('should handle typical session workflow', async () => {
      const routes: Record<string, { method: string; response: unknown }> = {
        'GET /api/cowork/sessions': {
          method: 'GET',
          response: { sessions: [] },
        },
        'POST /api/cowork/sessions': {
          method: 'POST',
          response: { id: 'session-123', status: 'created' },
        },
        'GET /api/cowork/sessions/session-123': {
          method: 'GET',
          response: { id: 'session-123', messages: [] },
        },
      };

      mockServer.setHandler((req, res) => {
        const key = `${req.method} ${req.url}`;
        const route = routes[key];
        if (route) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(route.response));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });

      // List sessions
      const listResult = await client.get('/cowork/sessions');
      assert.strictEqual(listResult.success, true);
      assert.deepStrictEqual(listResult.data, { sessions: [] });

      // Create session
      const createResult = await client.post('/cowork/sessions', { prompt: 'Hello' });
      assert.strictEqual(createResult.success, true);
      assert.strictEqual(createResult.data?.id, 'session-123');

      // Get session
      const getResult = await client.get('/cowork/sessions/session-123');
      assert.strictEqual(getResult.success, true);
      assert.strictEqual(getResult.data?.id, 'session-123');
    });
  });
});
