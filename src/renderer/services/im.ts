/**
 * Stub IM service for web builds
 * IM features are not available in web version
 */

export const imService = {
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
  testConnectivity: async () => ({ success: false, error: 'Not available in web' }),
};
