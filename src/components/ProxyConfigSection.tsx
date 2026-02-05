import { useState, useEffect } from 'react';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';
import { useProxy } from '../hooks/useProxy';
import type { ProxyType, ProxyConfig } from '../types/proxy';
import { invoke } from '@tauri-apps/api/core';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { InputGroup, InputGroupInput } from './ui/input-group';
import { Button } from './ui/button';

interface FormErrors {
  host?: string;
  port?: string;
}

export function ProxyConfigSection() {
  const {
    config,
    setConfig,
    saveConfig,
    testConnection,
    toggleProxy,
    refreshStatus,
    testResult,
    isTesting,
    isLoading,
    error,
    clearError,
  } = useProxy();

  const [localConfig, setLocalConfig] = useState<ProxyConfig>(config);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const validate = (values: ProxyConfig): FormErrors => {
    const newErrors: FormErrors = {};
    if (!values.host) {
      newErrors.host = 'Host is required';
    }
    if (!values.port) {
      newErrors.port = 'Port is required';
    } else if (values.port < 1 || values.port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }
    return newErrors;
  };

  const handleChange = (field: keyof ProxyConfig, value: string | number | boolean) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    setErrors(validate(newConfig));
  };

  const normalizeConfig = (input: ProxyConfig): ProxyConfig => ({
    ...input,
    username: input.username?.trim() ? input.username.trim() : undefined,
    password: input.password?.trim() ? input.password : undefined,
  });

  const handleSave = async () => {
    const formErrors = validate(localConfig);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    const sanitizedConfig = normalizeConfig(localConfig);
    setConfig(sanitizedConfig);

    if (sanitizedConfig.enabled) {
      const result = await testConnection();
      if (result.success) {
        await saveConfig();
        await toggleProxy(true);
        try {
          await invoke('trigger_health_check');
        } catch (e) {
          // ignore failures
        }
        await refreshStatus();
      }
      return;
    }

    await saveConfig();
    await toggleProxy(false);
    await refreshStatus();
  };

  const handleTest = async () => {
    const formErrors = validate(localConfig);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    const sanitizedConfig = normalizeConfig(localConfig);
    setConfig(sanitizedConfig);
    await testConnection();
  };

  const isDisabled = !localConfig.enabled;

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h4 className="text-sm font-semibold">Enable Proxy</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Route traffic through proxy server
          </p>
        </div>
        <Switch
          checked={localConfig.enabled}
          onCheckedChange={(checked) => handleChange('enabled', checked)}
        />
      </div>

      {/* Proxy Settings - Disabled when proxy is off */}
      <div className={`space-y-4 p-4 rounded-lg border transition-all ${isDisabled ? 'bg-muted/50 border-muted opacity-60' : 'bg-background border-border'}`}>
        {/* Proxy Type */}
        <div className="grid gap-2">
          <Label htmlFor="proxy-type">Proxy Type</Label>
          <Select
            value={localConfig.type}
            onValueChange={(value) => handleChange('type', value as ProxyType)}
            disabled={isDisabled}
          >
            <SelectTrigger className="w-full" id="proxy-type" disabled={isDisabled}>
              <SelectValue placeholder="Select proxy type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="socks5">SOCKS5</SelectItem>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="https">HTTPS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Host & Port */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label htmlFor="proxy-host">Host</Label>
            <InputGroup>
              <InputGroupInput
                id="proxy-host"
                type="text"
                value={localConfig.host}
                onChange={(e) => handleChange('host', e.target.value)}
                placeholder="proxy.example.com"
                disabled={isDisabled}
                aria-invalid={!!errors.host}
              />
            </InputGroup>
            {errors.host && <p className="text-xs text-destructive mt-1">{errors.host}</p>}
          </div>
          <div>
            <Label htmlFor="proxy-port">Port</Label>
            <InputGroup>
              <InputGroupInput
                id="proxy-port"
                type="number"
                value={localConfig.port}
                onChange={(e) => handleChange('port', parseInt(e.target.value) || 0)}
                placeholder="1080"
                disabled={isDisabled}
                aria-invalid={!!errors.port}
              />
            </InputGroup>
            {errors.port && <p className="text-xs text-destructive mt-1">{errors.port}</p>}
          </div>
        </div>

        {/* Authentication */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Authentication (Optional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proxy-username">Username</Label>
              <InputGroup>
                <InputGroupInput
                  id="proxy-username"
                  type="text"
                  value={localConfig.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="username"
                  disabled={isDisabled}
                />
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="proxy-password">Password</Label>
              <InputGroup>
                <InputGroupInput
                  id="proxy-password"
                  type="password"
                  value={localConfig.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  disabled={isDisabled}
                />
              </InputGroup>
            </div>
          </div>
        </div>

        {/* Auto-connect */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Auto-connect on Startup</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect automatically when app launches
            </p>
          </div>
          <Switch
            checked={localConfig.autoConnect}
            onCheckedChange={(checked) => handleChange('autoConnect', checked)}
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-sm ${
                testResult.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}
            >
              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
            </p>
            {testResult.success && testResult.latencyMs && (
              <p className="text-xs text-muted-foreground mt-1">
                Latency: {testResult.latencyMs}ms
                {testResult.externalIp && ` • IP: ${testResult.externalIp}`}
              </p>
            )}
            {testResult.error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {testResult.error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={clearError}
            className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          onClick={handleTest}
          disabled={isTesting || !localConfig.host || Object.keys(errors).length > 0 || isDisabled}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Test Connection
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || !localConfig.host || Object.keys(errors).length > 0}
          size="sm"
          className="gap-2 flex-1"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save & Apply
        </Button>
      </div>
    </div>
  );
}
