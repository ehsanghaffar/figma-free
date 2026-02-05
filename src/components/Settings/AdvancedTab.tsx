import { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useProxyStore } from '../../store/proxyStore';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { InputGroup, InputGroupInput } from '../ui/input-group';
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
          <h3 className="text-sm font-medium">WebRTC Leak Protection</h3>
          <p className="text-xs text-muted-foreground">Prevent IP leaks through WebRTC</p>
        </div>
        <Switch
          checked={localSettings.webrtcProtection}
          onCheckedChange={(checked) => handleChange('webrtcProtection', checked)}
        />
      </div>

      {/* Kill Switch */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Kill Switch</h3>
          <p className="text-xs text-muted-foreground">Block all traffic if proxy disconnects</p>
        </div>
        <Switch
          checked={localSettings.killSwitch}
          onCheckedChange={(checked) => handleChange('killSwitch', checked)}
        />
      </div>

      {/* Auto Update */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Auto-update</h3>
          <p className="text-xs text-muted-foreground">Automatically check for updates</p>
        </div>
        <Switch
          checked={localSettings.autoUpdate}
          onCheckedChange={(checked) => handleChange('autoUpdate', checked)}
        />
      </div>

      {/* Custom DNS */}
      <div>
        <Label htmlFor="custom-dns">Custom DNS Servers</Label>
        <InputGroup>
          <InputGroupInput
            id="custom-dns"
            type="text"
            value={localSettings.customDns || ''}
            onChange={(e) => handleChange('customDns', e.target.value || null)}
            placeholder="1.1.1.1, 8.8.8.8"
          />
        </InputGroup>
        <p className="text-xs text-muted-foreground mt-1">Comma-separated list of DNS servers</p>
      </div>

      {/* Custom User Agent */}
      <div>
        <Label htmlFor="custom-ua">Custom User Agent</Label>
        <InputGroup>
          <InputGroupInput
            id="custom-ua"
            type="text"
            value={localSettings.customUserAgent || ''}
            onChange={(e) => handleChange('customUserAgent', e.target.value || null)}
            placeholder="Leave empty for default"
          />
        </InputGroup>
      </div>

      {/* Clear Cache */}
      <div className="pt-4 border-t border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-300 mb-4">Data & Cache</h3>
        <Button
          onClick={handleClearCache}
          disabled={isClearingCache}
          variant="destructive"
          size="sm"
          className="w-full sm:w-auto"
        >
          {isClearingCache && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Cache & Cookies
        </Button>
        <p className="text-xs text-muted-foreground mt-2">This will sign you out of Figma</p>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
