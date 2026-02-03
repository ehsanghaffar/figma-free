import { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useProxyStore } from '../../store/proxyStore';
import type { AdvancedSettings } from '../../types/proxy';

export function AdvancedTab() {
  const { advancedSettings, setAdvancedSettings, saveAdvancedSettings, isLoading } = useProxyStore();
  const [localSettings, setLocalSettings] = useState<AdvancedSettings>(advancedSettings);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    setLocalSettings(advancedSettings);
  }, [advancedSettings]);

  const handleChange = (field: keyof AdvancedSettings, value: string | boolean | null) => {
    setLocalSettings((prev: AdvancedSettings) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setAdvancedSettings(localSettings);
    await saveAdvancedSettings();
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await invoke('clear_cache');
      // Could show a success notification here
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* WebRTC Protection */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-200">WebRTC Leak Protection</h3>
          <p className="text-xs text-neutral-500">Prevent IP leaks through WebRTC</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.webrtcProtection}
            onChange={(e) => handleChange('webrtcProtection', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Kill Switch */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-200">Kill Switch</h3>
          <p className="text-xs text-neutral-500">Block all traffic if proxy disconnects</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.killSwitch}
            onChange={(e) => handleChange('killSwitch', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Auto Update */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-200">Auto-update</h3>
          <p className="text-xs text-neutral-500">Automatically check for updates</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.autoUpdate}
            onChange={(e) => handleChange('autoUpdate', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Custom DNS */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Custom DNS Servers
        </label>
        <input
          type="text"
          value={localSettings.customDns || ''}
          onChange={(e) => handleChange('customDns', e.target.value || null)}
          placeholder="1.1.1.1, 8.8.8.8"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-neutral-500 mt-1">Comma-separated list of DNS servers</p>
      </div>

      {/* Custom User Agent */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Custom User Agent
        </label>
        <input
          type="text"
          value={localSettings.customUserAgent || ''}
          onChange={(e) => handleChange('customUserAgent', e.target.value || null)}
          placeholder="Leave empty for default"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Clear Cache */}
      <div className="pt-4 border-t border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-300 mb-4">Data & Cache</h3>
        <button
          onClick={handleClearCache}
          disabled={isClearingCache}
          className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400 transition-colors disabled:opacity-50"
        >
          {isClearingCache ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Clear Cache & Cookies
        </button>
        <p className="text-xs text-neutral-500 mt-2">This will sign you out of Figma</p>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
