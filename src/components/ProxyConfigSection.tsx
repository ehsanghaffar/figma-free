import { useState, useEffect } from "react";
import { Loader2, Play } from "lucide-react";
import { useProxy } from "../hooks/useProxy";
import type { ProxyType, ProxyConfig } from "../types/proxy";
import { invoke } from "@tauri-apps/api/core";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { InputGroup, InputGroupInput } from "./ui/input-group";
import { Button } from "./ui/button";
import { message } from '@tauri-apps/plugin-dialog';


interface FormErrors {
  host?: string;
  port?: string;
}

export function ProxyConfigSection() {
  const { config, setConfig, saveConfig, testConnection, toggleProxy, refreshStatus, isTesting, isLoading } = useProxy();

  const [localConfig, setLocalConfig] = useState<ProxyConfig>(config);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const validate = (values: ProxyConfig): FormErrors => {
    const newErrors: FormErrors = {};
    if (!values.host) {
      newErrors.host = "Host is required";
    }
    if (!values.port) {
      newErrors.port = "Port is required";
    } else if (values.port < 1 || values.port > 65535) {
      newErrors.port = "Port must be between 1 and 65535";
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
    username: input.username?.trim() || undefined,
    password: input.password?.trim() || undefined,
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
      try {
        const result = await testConnection();
        if (result.success) {
          await saveConfig();
          await toggleProxy(true);
          message("Proxy configuration applied successfully!", {title: "Success", kind: "info"});
          try {
            await invoke("trigger_health_check");
          } catch (e) {
            console.error('Health check failed:', e);
          }
          await refreshStatus();
        } else {
          message("Proxy test failed!", {title: "Error", kind: "error"});
        }
      } catch (err) {
        message(`Failed to apply configuration: ${String(err)}`, {title: "Error", kind: "error"});
      }
      return;
    }

    try {
      await saveConfig();
      await toggleProxy(false);
      await refreshStatus();
    } catch (err) {
      message(`Failed to save configuration: ${String(err)}`, {title: "Error", kind: "error"});
    }
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
    <div className="space-y-6 flex flex-col">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h4 className="text-sm font-semibold">Enable Proxy</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Route traffic through proxy server</p>
        </div>
        <Switch checked={localConfig.enabled} onCheckedChange={(checked) => handleChange("enabled", checked)} />
      </div>

      {/* Proxy Settings - Disabled when proxy is off */}
      <div
        className={`space-y-6 p-4 rounded-lg border transition-all ${isDisabled ? "bg-muted/50 border-muted opacity-60" : "bg-background border-border"}`}
      >
        {/* Proxy Type */}
        <div className="grid gap-2">
          <Label htmlFor="proxy-type">Proxy Type</Label>
          <Select
            value={localConfig.type}
            onValueChange={(value) => handleChange("type", value as ProxyType)}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="proxy-host">Host</Label>
            <InputGroup>
              <InputGroupInput
                id="proxy-host"
                type="text"
                value={localConfig.host}
                onChange={(e) => handleChange("host", e.target.value)}
                placeholder="proxy.example.com"
                disabled={isDisabled}
                aria-invalid={!!errors.host}
              />
            </InputGroup>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proxy-port">Port</Label>
            <InputGroup>
              <InputGroupInput
                id="proxy-port"
                type="number"
                value={localConfig.port}
                onChange={(e) => handleChange("port", parseInt(e.target.value) || 0)}
                placeholder="1080"
                disabled={isDisabled}
                aria-invalid={!!errors.port}
              />
            </InputGroup>
          </div>
        </div>

        {/* Authentication */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Authentication (Optional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="proxy-username">Username</Label>
              <InputGroup>
                <InputGroupInput
                  id="proxy-username"
                  type="text"
                  value={localConfig.username || ""}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="username"
                  disabled={isDisabled}
                />
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="proxy-password">Password</Label>
              <InputGroup>
                <InputGroupInput
                  id="proxy-password"
                  type="password"
                  value={localConfig.password || ""}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  disabled={isDisabled}
                />
              </InputGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-8">
        <Button
          onClick={handleTest}
          disabled={isTesting || !localConfig.host || Object.keys(errors).length > 0 || isDisabled}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
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
