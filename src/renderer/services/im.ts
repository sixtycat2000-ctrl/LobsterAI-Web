/**
 * Stub IM service for web builds
 * IM features are not available in web version
 */

import type { IMPlatform, IMGatewayConfig, IMConnectivityTestResult } from '../types/im';

export const imService = {
  init: async () => {
    console.warn('[IMService] IM features are not available in web version');
    return { success: true };
  },
  destroy: () => {
    console.warn('[IMService] IM features are not available in web version');
  },
  getDingTalkConfig: async () => ({ success: false, error: 'Not available in web' }),
  setDingTalkConfig: async () => ({ success: false, error: 'Not available in web' }),
  getFeishuConfig: async () => ({ success: false, error: 'Not available in web' }),
  setFeishuConfig: async () => ({ success: false, error: 'Not available in web' }),
  getQQConfig: async () => ({ success: false, error: 'Not available in web' }),
  setQQConfig: async () => ({ success: false, error: 'Not available in web' }),
  getTelegramConfig: async () => ({ success: false, error: 'Not available in web' }),
  setTelegramConfig: async () => ({ success: false, error: 'Not available in web' }),
  getDiscordConfig: async () => ({ success: false, error: 'Not available in web' }),
  setDiscordConfig: async () => ({ success: false, error: 'Not available in web' }),
  getNimConfig: async () => ({ success: false, error: 'Not available in web' }),
  setNimConfig: async () => ({ success: false, error: 'Not available in web' }),
  getXiaomifengConfig: async () => ({ success: false, error: 'Not available in web' }),
  setXiaomifengConfig: async () => ({ success: false, error: 'Not available in web' }),
  getWecomConfig: async () => ({ success: false, error: 'Not available in web' }),
  setWecomConfig: async () => ({ success: false, error: 'Not available in web' }),
  testConnectivity: async (): Promise<IMConnectivityTestResult> => ({
    success: false,
    message: 'Not available in web',
    verdict: 'fail',
    checks: [],
    testedAt: new Date().toISOString(),
  }),
  updateConfig: async (_platform: IMPlatform, _config: IMGatewayConfig) => ({ success: false, error: 'Not available in web' }),
  startGateway: async (_platform: IMPlatform) => ({ success: false, error: 'Not available in web' }),
  stopGateway: async (_platform: IMPlatform) => ({ success: false, error: 'Not available in web' }),
};
