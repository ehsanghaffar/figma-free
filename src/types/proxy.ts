// Proxy configuration types matching Rust backend

export type ProxyType = 'socks5' | 'http' | 'https';

export interface ProxyConfig {
  enabled: boolean;
  type: ProxyType;
  host: string;
  port: number;
  username?: string;
  password?: string;
  autoDetect: boolean;
  autoConnect: boolean;
}

export interface ProxyTestResult {
  success: boolean;
  latencyMs: number | null;
  error: string | null;
  externalIp: string | null;
}

export interface ProxyStatus {
  isConnected: boolean;
  config: ProxyConfig | null;
  latencyMs: number | null;
  lastError: string | null;
  lastUpdated: string;
}

// Advanced settings
export interface AdvancedSettings {
  customDns: string | null;
  webrtcProtection: boolean;
  customUserAgent: string | null;
  killSwitch: boolean;
  autoUpdate: boolean;
}

// Connection status for UI
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ConnectionInfo {
  status: ConnectionStatus;
  latency: number | null;
  externalIp: string | null;
  error: string | null;
}

// Default values
export const defaultProxyConfig: ProxyConfig = {
  enabled: false,
  type: 'socks5',
  host: '',
  port: 1080,
  autoDetect: false,
  autoConnect: false,
};

export const defaultAdvancedSettings: AdvancedSettings = {
  customDns: null,
  webrtcProtection: true,
  customUserAgent: null,
  killSwitch: false,
  autoUpdate: true,
};
