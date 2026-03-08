/**
 * HTTP Client for Web Build
 * Provides RESTful API communication with the backend server
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

  /**
   * Generic request method
   */
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

  /**
   * GET request
   */
  async get<T>(path: string): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(path: string, body?: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(path: string, body?: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * SSE Streaming request
   * Returns an AbortController for cancellation
   */
  async stream(
    path: string,
    body: unknown,
    onMessage: (data: any) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
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
        onError?.(`HTTP ${response.status}`);
        return controller;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError?.('No response body');
        return controller;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const read = async (): Promise<void> => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process SSE format: data: {...}\n\n
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  onMessage(data);
                } catch {
                  // Not JSON, pass as string
                  onMessage(line.slice(6));
                }
              }
            }
          }
          onComplete?.();
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            onError?.(error.message);
          }
        }
      };

      read();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error.message);
      }
    }

    return controller;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
