/**
 * Stub IM types for web builds
 * IM features are not available in web version
 */

export type IMPlatform = 'dingtalk' | 'feishu' | 'qq' | 'telegram' | 'discord' | 'nim' | 'xiaomifeng' | 'wecom';

export interface IMGatewayConfig {
  enabled: boolean;
  webhookUrl?: string;
  appId?: string;
  appSecret?: string;
}

export interface IMConnectivityCheck {
  success: boolean;
  message: string;
}

export interface IMConnectivityTestResult {
  success: boolean;
  message: string;
}
