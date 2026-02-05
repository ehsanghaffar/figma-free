import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useProxyStore } from '../store/proxyStore';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { InputGroup, InputGroupInput } from './ui/input-group';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface DNSConfig {
  enabled: boolean;
  dnsServers: string;
  customHeaders: string;
}

export function DNSConfigSection() {
  const { advancedSettings, setAdvancedSettings, saveAdvancedSettings, isLoading } = useProxyStore();
  const [localConfig, setLocalConfig] = useState<DNSConfig>({
    enabled: !!advancedSettings.customDns?.trim(),
    dnsServers: advancedSettings.customDns || '',
    customHeaders: advancedSettings.customUserAgent || '',
  });

  useEffect(() => {
    setLocalConfig({
      enabled: !!advancedSettings.customDns?.trim(),
      dnsServers: advancedSettings.customDns || '',
      customHeaders: advancedSettings.customUserAgent || '',
    });
  }, [advancedSettings]);

  const handleChange = (field: keyof DNSConfig, value: string | boolean) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
  };

  const validateDNS = (dns: string): boolean => {
    if (!dns.trim()) return true;
    const servers = dns.split(',').map(s => s.trim());
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return servers.every(server => ipv4Regex.test(server) && 
      server.split('.').every(octet => parseInt(octet) <= 255));
  };

  const handleSave = async () => {
    if (localConfig.enabled && !validateDNS(localConfig.dnsServers)) {
      toast.error('Invalid DNS format', {
        description: 'Please enter valid IPv4 addresses separated by commas',
      });
      return;
    }
    
    const updatedSettings = {
      ...advancedSettings,
      customDns: localConfig.enabled ? localConfig.dnsServers.trim() || null : null,
      customUserAgent: localConfig.enabled ? localConfig.customHeaders.trim() || null : null,
    };
    setAdvancedSettings(updatedSettings);
    try {
      await saveAdvancedSettings();
      toast.success('DNS & Headers saved successfully');
    } catch (err) {
      toast.error('Failed to save settings', {
        description: String(err),
      });
    }
  };

  const isDisabled = !localConfig.enabled;

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h4 className="text-sm font-semibold">Enable DNS & Headers</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Override system DNS and custom headers
          </p>
        </div>
        <Switch
          checked={localConfig.enabled}
          onCheckedChange={(checked) => handleChange('enabled', checked)}
        />
      </div>

      {/* Settings - Disabled when feature is off */}
      <div
        className={`space-y-4 p-4 rounded-lg border transition-all ${
          isDisabled
            ? 'bg-muted/50 border-muted opacity-60'
            : 'bg-background border-border'
        }`}
      >
        {/* DNS Servers */}
        <div>
          <Label htmlFor="dns-servers">DNS Servers</Label>
          <p className="text-xs text-muted-foreground mb-1">
            Comma-separated list of DNS servers
          </p>
          <InputGroup>
            <InputGroupInput
              id="dns-servers"
              type="text"
              value={localConfig.dnsServers}
              onChange={(e) => handleChange('dnsServers', e.target.value)}
              placeholder="1.1.1.1, 8.8.8.8"
              disabled={isDisabled}
            />
          </InputGroup>
          <p className="text-xs text-muted-foreground mt-1">
            Examples: Cloudflare (1.1.1.1), Google (8.8.8.8), Quad9 (9.9.9.9)
          </p>
        </div>

        {/* Custom Headers */}
        <div className="border-t pt-2">
          <Label htmlFor="custom-headers">Custom User-Agent</Label>
          <p className="text-xs text-muted-foreground mb-2">
            JSON format for custom HTTP headers
          </p>
          <Textarea
            id="custom-headers"
            value={localConfig.customHeaders}
            onChange={(e) => handleChange('customHeaders', e.target.value)}
            placeholder='{"User-Agent": "Custom Agent"}'
            disabled={isDisabled}
            className="font-mono text-sm"
          />
        </div>

        {/* Info Box */}
        <div className="border-t pt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Note:</span> These settings enhance privacy and
            bypass certain restrictions. Use responsibly and in accordance with
            applicable laws.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          size="sm"
          className="flex-1"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save DNS & Headers
        </Button>
      </div>
    </div>
  );
}
