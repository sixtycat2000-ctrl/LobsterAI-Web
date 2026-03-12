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
  botToken?: string;
  appKey?: string;
  account?: string;
  token?: string;
  agentId?: string;
  secret?: string;
}

export interface IMConnectivityCheck {
  success: boolean;
  message: string;
  level: 'pass' | 'info' | 'warn' | 'fail';
}

export interface IMConnectivityTestResult {
  success: boolean;
  message: string;
  verdict: 'pass' | 'warn' | 'fail';
  checks: IMConnectivityCheck[];
  testedAt: string;
}

export interface IMStatus {
  dingtalk: { connected: boolean; error?: string };
  feishu: { connected: boolean; error?: string };
  qq: { connected: boolean; error?: string };
  telegram: { connected: boolean; error?: string };
  discord: { connected: boolean; error?: string };
  nim: { connected: boolean; error?: string };
  xiaomifeng: { connected: boolean; error?: string };
  wecom: { connected: boolean; error?: string };
}

export interface IMConfig {
  dingtalk: IMGatewayConfig;
  feishu: IMGatewayConfig;
  qq: IMGatewayConfig;
  telegram: IMGatewayConfig;
  discord: IMGatewayConfig;
  nim: IMGatewayConfig;
  xiaomifeng: IMGatewayConfig;
  wecom: IMGatewayConfig;
}
