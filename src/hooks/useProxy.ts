import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useProxyStore, useSettingsStore } from '../store/proxyStore';
import type { ConnectionInfo, ConnectionStatus } from '../types/proxy';
import { toast } from "sonner"

/**
 * Hook for managing proxy configuration and status
 */
export function useProxy() {
  const store = useProxyStore();
  const loadConfig = useProxyStore(state => state.loadConfig);
  const refreshStatus = useProxyStore(state => state.refreshStatus);
  
  // Initialize on mount
  useEffect(() => {
    loadConfig();
    refreshStatus();
    
    // Set up periodic status refresh
    const interval = setInterval(() => {
      refreshStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loadConfig, refreshStatus]);
  
  // Listen for proxy toggle events from system tray
  useEffect(() => {
    const setConfig = store.setConfig;
    const refresh = store.refreshStatus;
    
    const unlisten = listen<boolean>('proxy-toggled', (event) => {
      setConfig({ enabled: event.payload });
      refresh();
    });
    
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [store.setConfig, store.refreshStatus]);
  
  const saveAndEnable = useCallback(async () => {
    await store.saveConfig();
    if (!store.config.enabled) {
      await store.toggleProxy(true);
    }
  }, [store.saveConfig, store.toggleProxy, store.config.enabled]);
  
  const testAndSave = useCallback(async () => {
    const result = await store.testConnection();
    if (result.success) {
      await store.saveConfig();
      toast.success("Proxy configured successfully!")
    }
    else {
      toast.error("Proxy test failed!", {
        description: result.error,
      })
      return result;
    }
  }, [store.testConnection, store.saveConfig]);
  
  return {
    config: store.config,
    status: store.status,
    isLoading: store.isLoading,
    isTesting: store.isTesting,
    testResult: store.testResult,
    error: store.error,
    setConfig: store.setConfig,
    saveConfig: store.saveConfig,
    testConnection: store.testConnection,
    toggleProxy: store.toggleProxy,
    refreshStatus: store.refreshStatus,
    clearError: store.clearError,
    saveAndEnable,
    testAndSave,
  };
}

/**
 * Hook for connection status display
 */
export function useConnectionStatus(): ConnectionInfo {
  const { status, config, testResult, isTesting } = useProxyStore();
  
  // Determine connection status
  let connectionStatus: ConnectionStatus = 'disconnected';
  
  if (isTesting) {
    connectionStatus = 'connecting';
  } else if (!config.enabled) {
    connectionStatus = 'disconnected';
  } else if (status?.isConnected) {
    connectionStatus = 'connected';
  } else if (status?.lastError) {
    connectionStatus = 'error';
  }
  
  return {
    status: connectionStatus,
    latency: status?.latencyMs ?? testResult?.latencyMs ?? null,
    externalIp: testResult?.externalIp ?? null,
    error: status?.lastError ?? testResult?.error ?? null,
  };
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const settingsOpen = useSettingsStore(state => state.open);
  const settingsClose = useSettingsStore(state => state.close);
  const isOpen = useSettingsStore(state => state.isOpen);
  const toggleProxy = useProxyStore(state => state.toggleProxy);
  const enabled = useProxyStore(state => state.config.enabled);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + , to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        settingsOpen();
      }
      
      // Escape to close settings
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        settingsClose();
      }
      
      // Cmd/Ctrl + Shift + P to toggle proxy
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        toggleProxy(!enabled);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, settingsClose, isOpen, toggleProxy, enabled]);
}

/**
 * Hook for listening to settings open event from system tray
 */
export function useSettingsListener() {
  const settingsOpen = useSettingsStore(state => state.open);
  
  useEffect(() => {
    const unlisten = listen('open-settings', () => {
      settingsOpen();
    });
    
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [settingsOpen]);
}

/**
 * Hook to manage advanced settings 
 */
export function useAdvancedSettings() {
  const loadAdvancedSettings = useProxyStore(state => state.loadAdvancedSettings);
  const advancedSettings = useProxyStore(state => state.advancedSettings);
  
  useEffect(() => {
    loadAdvancedSettings();
  }, [loadAdvancedSettings]);

  const hasCustomDNS = advancedSettings.customDns?.trim() || null;
  
  return {
    advancedSettings,
    DNSStatus: hasCustomDNS,
  };
}