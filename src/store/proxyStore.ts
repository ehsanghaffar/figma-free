import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type {
  ProxyConfig,
  ProxyStatus,
  ProxyTestResult,
  AdvancedSettings,
} from '../types/proxy';

interface ProxyStore {
  // Proxy state
  config: ProxyConfig;
  status: ProxyStatus | null;
  
  // UI state
  isLoading: boolean;
  isTesting: boolean;
  testResult: ProxyTestResult | null;
  error: string | null;
  
  // Advanced settings
  advancedSettings: AdvancedSettings;
  
  // Actions
  setConfig: (config: Partial<ProxyConfig>) => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<ProxyConfig | Error>;
  testConnection: () => Promise<ProxyTestResult>;
  toggleProxy: (enabled: boolean) => Promise<void>;
  refreshStatus: () => Promise<void>;
  setAdvancedSettings: (settings: Partial<AdvancedSettings>) => void;
  saveAdvancedSettings: () => Promise<void>;
  loadAdvancedSettings: () => Promise<void>;
  clearError: () => void;
}

export const useProxyStore = create<ProxyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      config: {
        enabled: false,
        type: 'socks5' as const,
        host: '',
        port: 1080,
        autoDetect: false,
        autoConnect: false,
      },
      status: null,
      isLoading: false,
      isTesting: false,
      testResult: null,
      error: null,
      advancedSettings: {
        customDns: null,
        webrtcProtection: true,
        customUserAgent: null,
        killSwitch: false,
        autoUpdate: true,
      },

      // Actions
      setConfig: (config: Partial<ProxyConfig>) => {
        set((state: ProxyStore) => ({
          config: { ...state.config, ...config },
          testResult: null, // Clear test result when config changes
        }));
      },

      saveConfig: async () => {
        const { config } = get();
        set({ isLoading: true, error: null });
        
        try {
          await invoke('set_proxy_config', { config });
          await get().refreshStatus();
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          set({ error });
        } finally {
          set({ isLoading: false });
        }
      },

      loadConfig: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const config = await invoke<ProxyConfig>('get_proxy_config');
          set({ config });
          return config
        } catch (err) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          set({ error: errorObj.message });
          return errorObj
        } finally {
          set({ isLoading: false });
        }
      },

      testConnection: async () => {
        const { config } = get();
        set({ isTesting: true, testResult: null, error: null });
        
        try {
          const result = await invoke<ProxyTestResult>('test_proxy_connection', { config });
          set({ testResult: result });
          return result;
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          const result: ProxyTestResult = {
            success: false,
            latencyMs: null,
            error,
            externalIp: null,
          };
          set({ testResult: result, error });
          return result;
        } finally {
          set({ isTesting: false });
        }
      },

      toggleProxy: async (enabled: boolean) => {
        set({ isLoading: true, error: null });
        
        try {
          await invoke('toggle_proxy', { enabled });
          set((state: ProxyStore) => ({
            config: { ...state.config, enabled },
          }));
          await get().refreshStatus();
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          set({ error });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshStatus: async () => {
        try {
          const status = await invoke<ProxyStatus>('get_proxy_status');
          set({ status });
        } catch (err) {
          console.error('Failed to refresh status:', err);
        }
      },

      setAdvancedSettings: (settings: Partial<AdvancedSettings>) => {
        set((state: ProxyStore) => ({
          advancedSettings: { ...state.advancedSettings, ...settings },
        }));
      },

      saveAdvancedSettings: async () => {
        const { advancedSettings } = get();
        set({ isLoading: true, error: null });
        
        try {
          await invoke('save_advanced_settings', { settings: advancedSettings });
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          set({ error });
        } finally {
          set({ isLoading: false });
        }
      },

      loadAdvancedSettings: async () => {
        try {
          const settings = await invoke<AdvancedSettings>('get_advanced_settings');
          set({ advancedSettings: settings });
        } catch (err) {
          console.error('Failed to load advanced settings:', err);
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'figma-proxy-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: ProxyStore) => ({
        config: state.config,
        advancedSettings: state.advancedSettings,
      }),
    }
  )
);

// Settings panel state
interface SettingsStore {
  isOpen: boolean;
  activeTab: 'proxy' | 'advanced' | 'about';
  open: (tab?: 'proxy' | 'advanced' | 'about') => void;
  close: () => void;
  setTab: (tab: 'proxy' | 'advanced' | 'about') => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  isOpen: false,
  activeTab: 'advanced',
  open: (tab: 'proxy' | 'advanced' | 'about' = 'advanced') => set({ isOpen: true, activeTab: tab }),
  close: () => set({ isOpen: false }),
  setTab: (tab: 'proxy' | 'advanced' | 'about') => set({ activeTab: tab }),
}));

// App state
interface AppStore {
  isFirstRun: boolean;
  appVersion: string;
  setFirstRun: (value: boolean) => void;
  setAppVersion: (version: string) => void;
  loadAppInfo: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  isFirstRun: true,
  appVersion: '0.1.0',
  setFirstRun: (isFirstRun: boolean) => set({ isFirstRun }),
  setAppVersion: (appVersion: string) => set({ appVersion }),
  loadAppInfo: async () => {
    try {
      const [isFirstRun, appVersion] = await Promise.all([
        invoke<boolean>('is_first_run'),
        invoke<string>('get_app_version'),
      ]);
      set({ isFirstRun, appVersion });
    } catch (err) {
      console.error('Failed to load app info:', err);
    }
  },
}));
