import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Play } from 'lucide-react';
import { useProxy } from '../../hooks/useProxy';
import type { ProxyType, ProxyConfig } from '../../types/proxy';

export function ProxyTab() {
  const {
    config,
    setConfig,
    saveConfig,
    testConnection,
    testResult,
    isTesting,
    isLoading,
    error,
    clearError,
    presets,
  } = useProxy();

  const [localConfig, setLocalConfig] = useState<ProxyConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = (field: keyof ProxyConfig, value: string | number | boolean) => {
    setLocalConfig((prev: ProxyConfig) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setConfig(localConfig);
    await saveConfig();
  };

  const handleTest = async () => {
    setConfig(localConfig);
    await testConnection();
  };

  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const preset = presets.find((p: { name: string }) => p.name === selectedName);
    if (preset) {
      setLocalConfig((prev: ProxyConfig) => ({
        ...prev,
        type: preset.proxyType,
        host: preset.host,
        port: preset.port,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-200">Enable Proxy</h3>
          <p className="text-xs text-neutral-500">Route traffic through proxy server</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Preset Selector */}
      {presets.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Preset Servers
          </label>
          <select
            onChange={handlePresetSelect}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a preset...</option>
            {presets.map((preset: { name: string; location?: string }) => (
              <option key={preset.name} value={preset.name}>
                {preset.name} {preset.location && `(${preset.location})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Proxy Type */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Proxy Type
        </label>
        <select
          value={localConfig.type}
          onChange={(e) => handleChange('type', e.target.value as ProxyType)}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="socks5">SOCKS5</option>
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
        </select>
      </div>

      {/* Host & Port */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Host
          </label>
          <input
            type="text"
            value={localConfig.host}
            onChange={(e) => handleChange('host', e.target.value)}
            placeholder="proxy.example.com"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Port
          </label>
          <input
            type="number"
            value={localConfig.port}
            onChange={(e) => handleChange('port', parseInt(e.target.value) || 0)}
            placeholder="1080"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Authentication */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-neutral-300">Authentication (Optional)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Username</label>
            <input
              type="text"
              value={localConfig.username || ''}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="username"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Password</label>
            <input
              type="password"
              value={localConfig.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Auto-connect */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-neutral-300">Auto-connect on Startup</h4>
          <p className="text-xs text-neutral-500">Connect automatically when app launches</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localConfig.autoConnect}
            onChange={(e) => handleChange('autoConnect', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
            </span>
          </div>
          {testResult.success && testResult.latencyMs && (
            <p className="text-xs text-neutral-400 mt-2">
              Latency: {testResult.latencyMs}ms
              {testResult.externalIp && ` • IP: ${testResult.externalIp}`}
            </p>
          )}
          {testResult.error && (
            <p className="text-xs text-red-400 mt-2">{testResult.error}</p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="text-xs text-red-500 hover:text-red-400 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleTest}
          disabled={isTesting || !localConfig.host}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-neutral-200 transition-colors"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Test Connection
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || !localConfig.host}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save & Apply
        </button>
      </div>
    </div>
  );
}
