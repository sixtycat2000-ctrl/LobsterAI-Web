/**
 * API Client for Web Build
 * Replaces window.electron IPC calls with HTTP requests
 */

const DEFAULT_API_BASE = '/api';
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
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
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(path: string): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Streaming API (SSE)
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

// Singleton instance
export const apiClient = new ApiClient();
