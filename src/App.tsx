import { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { SettingsPanel } from './components/SettingsPanel';
import { HomeScreen } from './components/HomeScreen';
import { useAppStore, useProxyStore } from './store/proxyStore';

function App() {
  // Load app info and proxy config on mount
  const loadAppInfo = useAppStore((state) => state.loadAppInfo);
  const loadConfig = useProxyStore((state) => state.loadConfig);
  const loadAdvancedSettings = useProxyStore((state) => state.loadAdvancedSettings);

  useEffect(() => {
    loadAppInfo();
    loadAdvancedSettings();
    loadConfig().catch((err) => {
      console.error('Failed to load config:', err);
    });
  }, [loadAppInfo, loadConfig, loadAdvancedSettings]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <HomeScreen />

      {/* Settings Overlay */}
      <SettingsPanel />
    </div>
  );
}

export default App;
