import { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ProxyTab } from './components/Settings';
import { useKeyboardShortcuts, useSettingsListener, useConnectionStatus } from './hooks/useProxy';
import { useAppStore, useProxyStore } from './store/proxyStore';
import { invoke } from '@tauri-apps/api/core';
import { Figma } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

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
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />
      
      {/* Main Content: Proxy configuration and action */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Figma Proxy Configuration</CardTitle>
            <CardDescription>
              Configure your proxy settings to access Figma in restricted regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ProxyTab />

              {/* Open Figma action */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-neutral-800">
                <Button
                  size="lg"
                  onClick={launchFigma}
                  disabled={status !== 'connected'}
                  title={status !== 'connected' ? 'Connect proxy successfully to enable' : 'Open Figma'}
                  className="w-full"
                >
                  <Figma className="w-4 h-4 mr-2" />
                  Open Figma
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Settings Overlay */}
      <SettingsPanel />
    </div>
  );
}

export default App;
