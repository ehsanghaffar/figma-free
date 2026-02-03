import { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { SettingsPanel } from './components/SettingsPanel';
import { WebView } from './components/WebView';
import { useKeyboardShortcuts, useSettingsListener } from './hooks/useProxy';
import { useAppStore, useProxyStore } from './store/proxyStore';

function App() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Listen for settings open events from system tray
  useSettingsListener();
  
  // Load app info and proxy config on mount
  const loadAppInfo = useAppStore((state) => state.loadAppInfo);
  const loadConfig = useProxyStore((state) => state.loadConfig);
  const loadAdvancedSettings = useProxyStore((state) => state.loadAdvancedSettings);
  
  useEffect(() => {
    loadAppInfo();
    loadConfig();
    loadAdvancedSettings();
  }, [loadAppInfo, loadConfig, loadAdvancedSettings]);

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />
      
      {/* Main Content - Figma WebView */}
      <main className="flex-1 relative overflow-hidden">
        <WebView />
      </main>
      
      {/* Settings Overlay */}
      <SettingsPanel />
    </div>
  );
}

export default App;
