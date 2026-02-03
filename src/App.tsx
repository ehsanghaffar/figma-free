import { useEffect, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { SettingsPanel } from './components/SettingsPanel';
import { useKeyboardShortcuts, useSettingsListener } from './hooks/useProxy';
import { useAppStore, useProxyStore } from './store/proxyStore';
import { invoke } from '@tauri-apps/api/core';

function App() {

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Listen for settings open events from system tray
  useSettingsListener();
  
  // Load app info and proxy config on mount
  const loadAppInfo = useAppStore((state) => state.loadAppInfo);
  const loadConfig = useProxyStore((state) => state.loadConfig);
  const loadAdvancedSettings = useProxyStore((state) => state.loadAdvancedSettings);
  const [proxy, setProxy] = useState("http://127.0.0.1:1080");

  const launchFigma = async () => {
    try {
      await invoke("create_figma_window", { proxy });
    } catch (err) {
      alert("Failed to launch: " + err);
    }
  };
  
  useEffect( () => {
    loadAppInfo();
    loadAdvancedSettings();
    loadConfig().then( (value) => {
      if (value instanceof Error) {
        console.error('Failed to load config:', value);
        return;
      }
      setProxy(
        `http://${value.host}:${value.port}`
      );
    })
  }, [loadAppInfo, loadConfig, loadAdvancedSettings]);
  
  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />
      
      {/* Launch Figma button */}
      <div className="p-4 bg-neutral-900 flex justify-end">
        <button
          onClick={launchFigma}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Launch Figma
        </button>
      </div>
      
      {/* Settings Overlay */}
      <SettingsPanel />
    </div>
  );
}

export default App;
