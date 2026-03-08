import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiConfig } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig | null = null;

  constructor() {
    this.client = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  setConfig(config: ApiConfig) {
    this.config = config;
    this.client.defaults.baseURL = config.baseURL;
    if (config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  getConfig(): ApiConfig | null {
    return this.config;
  }

  // Cowork API
  async listSessions() {
    const response = await this.client.get('/api/cowork/sessions');
    return response.data;
  }

  async getSession(sessionId: string) {
    const response = await this.client.get(`/api/cowork/sessions/${sessionId}`);
    return response.data;
  }

  async createSession(data: { prompt: string; cwd?: string; systemPrompt?: string; title?: string }) {
    const response = await this.client.post('/api/cowork/sessions', data);
    return response.data;
  }

  async continueSession(sessionId: string, data: { prompt: string; systemPrompt?: string }) {
    const response = await this.client.post(`/api/cowork/sessions/${sessionId}/continue`, data);
    return response.data;
  }

  async deleteSession(sessionId: string) {
    const response = await this.client.delete(`/api/cowork/sessions/${sessionId}`);
    return response.data;
  }

  async renameSession(sessionId: string, title: string) {
    const response = await this.client.patch(`/api/cowork/sessions/${sessionId}`, { title });
    return response.data;
  }

  async setSessionPinned(sessionId: string, pinned: boolean) {
    const response = await this.client.patch(`/api/cowork/sessions/${sessionId}/pin`, { pinned });
    return response.data;
  }

  async stopSession(sessionId: string) {
    const response = await this.client.post(`/api/cowork/sessions/${sessionId}/stop`);
    return response.data;
  }

  async getCoworkConfig() {
    const response = await this.client.get('/api/cowork/config');
    return response.data;
  }

  async updateCoworkConfig(data: Record<string, unknown>) {
    const response = await this.client.patch('/api/cowork/config', data);
    return response.data;
  }

  // Skills API
  async listSkills() {
    const response = await this.client.get('/api/skills');
    return response.data;
  }

  async toggleSkill(skillId: string, enabled: boolean) {
    const response = await this.client.patch(`/api/skills/${skillId}`, { enabled });
    return response.data;
  }

  async deleteSkill(skillId: string) {
    const response = await this.client.delete(`/api/skills/${skillId}`);
    return response.data;
  }

  // MCP API
  async listMcpServers() {
    const response = await this.client.get('/api/mcp/servers');
    return response.data;
  }

  async toggleMcpServer(serverId: string, enabled: boolean) {
    const response = await this.client.patch(`/api/mcp/servers/${serverId}`, { enabled });
    return response.data;
  }

  async createMcpServer(data: Record<string, unknown>) {
    const response = await this.client.post('/api/mcp/servers', data);
    return response.data;
  }

  async updateMcpServer(serverId: string, data: Record<string, unknown>) {
    const response = await this.client.patch(`/api/mcp/servers/${serverId}`, data);
    return response.data;
  }

  async deleteMcpServer(serverId: string) {
    const response = await this.client.delete(`/api/mcp/servers/${serverId}`);
    return response.data;
  }

  // Tasks API
  async listTasks() {
    const response = await this.client.get('/api/tasks');
    return response.data;
  }

  async createTask(data: Record<string, unknown>) {
    const response = await this.client.post('/api/tasks', data);
    return response.data;
  }

  async updateTask(taskId: string, data: Record<string, unknown>) {
    const response = await this.client.patch(`/api/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: string) {
    const response = await this.client.delete(`/api/tasks/${taskId}`);
    return response.data;
  }

  async runTask(taskId: string) {
    const response = await this.client.post(`/api/tasks/${taskId}/run`);
    return response.data;
  }

  // Settings API
  async getSettings() {
    const response = await this.client.get('/api/settings');
    return response.data;
  }

  async updateSettings(data: Record<string, unknown>) {
    const response = await this.client.patch('/api/settings', data);
    return response.data;
  }

  // File operations
  async selectDirectory() {
    const response = await this.client.post('/api/files/select-directory');
    return response.data;
  }

  async readFile(path: string) {
    const response = await this.client.get('/api/files/read', { params: { path } });
    return response.data;
  }

  async writeFile(path: string, content: string) {
    const response = await this.client.post('/api/files/write', { path, content });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
