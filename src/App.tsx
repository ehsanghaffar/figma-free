import { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ProxyTab } from './components/Settings';
import { useKeyboardShortcuts, useSettingsListener, useConnectionStatus } from './hooks/useProxy';
import { useAppStore, useProxyStore } from './store/proxyStore';
import { invoke } from '@tauri-apps/api/core';
import { Figma } from 'lucide-react';

function App() {

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Listen for settings open events from system tray
  useSettingsListener();
  
  // Load app info and proxy config on mount
  const loadAppInfo = useAppStore((state) => state.loadAppInfo);
  const loadConfig = useProxyStore((state) => state.loadConfig);
  const loadAdvancedSettings = useProxyStore((state) => state.loadAdvancedSettings);
  const { status } = useConnectionStatus();
  const config = useProxyStore((state) => state.config);

  const launchFigma = async () => {
    try {
      const scheme = config.type === 'https' ? 'http' : (config.type || 'http');
      const host = config.host || '127.0.0.1';
      const port = config.port || 1080;
      const proxy = `${scheme}://${host}:${port}`;
      await invoke("create_figma_window", { proxy });
    } catch (err) {
      alert("Failed to launch: " + err);
    }
  };
  
  useEffect( () => {
    loadAppInfo();
    loadAdvancedSettings();
    loadConfig().catch((err) => {
      console.error('Failed to load config:', err);
    });
  }, [loadAppInfo, loadConfig, loadAdvancedSettings]);
  
  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />
      
      {/* Main Content: Proxy configuration and action */}
      <div className="flex-1 overflow-auto p-6 bg-neutral-950">
        {/* Proxy configuration inline on first webview */}
        <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-neutral-200 text-lg font-semibold mb-4">Proxy Settings</h2>
          <ProxyTab />

          {/* Open Figma action */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={launchFigma}
              disabled={status !== 'connected'}
              className="flex gap-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title={status !== 'connected' ? 'Connect proxy successfully to enable' : 'Open Figma'}
            >
              <Figma />
              Open Figma
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings Overlay */}
      <SettingsPanel />
    </div>
  );
}

export default App;
