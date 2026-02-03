import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useProxyStore, useSettingsStore } from '../store/proxyStore';
import type { ConnectionStatus, ConnectionInfo } from '../types/proxy';

/**
 * Hook for managing proxy configuration and status
 */
export function useProxy() {
  const store = useProxyStore();
  
  // Initialize on mount
  useEffect(() => {
    store.loadConfig();
    store.loadPresets();
    store.refreshStatus();
    
    // Set up periodic status refresh
    const interval = setInterval(() => {
      store.refreshStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Listen for proxy toggle events from system tray
  useEffect(() => {
    const unlisten = listen<boolean>('proxy-toggled', (event) => {
      store.setConfig({ enabled: event.payload });
      store.refreshStatus();
    });
    
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
  
  const saveAndEnable = useCallback(async () => {
    await store.saveConfig();
    if (!store.config.enabled) {
      await store.toggleProxy(true);
    }
  }, [store]);
  
  const testAndSave = useCallback(async () => {
    const result = await store.testConnection();
    if (result.success) {
      await store.saveConfig();
    }
    return result;
  }, [store]);
  
  return {
    config: store.config,
    status: store.status,
    presets: store.presets,
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
  const { status, config, testResult } = useProxyStore();
  
  // Determine connection status
  let connectionStatus: ConnectionStatus = 'disconnected';
  
  if (!config.enabled) {
    connectionStatus = 'disconnected';
  } else if (status?.isConnected) {
    connectionStatus = 'connected';
  } else if (status?.lastError) {
    connectionStatus = 'error';
  } else {
    connectionStatus = 'connecting';
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
  const settingsStore = useSettingsStore();
  const proxyStore = useProxyStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + , to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        settingsStore.open();
      }
      
      // Escape to close settings
      if (e.key === 'Escape' && settingsStore.isOpen) {
        e.preventDefault();
        settingsStore.close();
      }
      
      // Cmd/Ctrl + Shift + P to toggle proxy
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        proxyStore.toggleProxy(!proxyStore.config.enabled);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsStore, proxyStore]);
}

/**
 * Hook for listening to settings open event from system tray
 */
export function useSettingsListener() {
  const settingsStore = useSettingsStore();
  
  useEffect(() => {
    const unlisten = listen('open-settings', () => {
      settingsStore.open();
    });
    
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [settingsStore]);
}
