import { useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, WifiOff, ChevronDown } from 'lucide-react';
import { useConnectionStatus } from '../hooks/useProxy';
import type { ConnectionStatus } from '../types/proxy';
import { Button } from './ui/button';

export function ConnectionStatusSection() {
  const { status, latency } = useConnectionStatus();
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig: Record<ConnectionStatus, {
    icon: React.ReactNode;
    label: string;
    description: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeColor: string;
    dotColor: string;
  }> = {
    connected: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: 'Connected',
      description: 'Proxy is active and running smoothly',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      textColor: 'text-green-700 dark:text-green-300',
      badgeColor: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50',
      dotColor: 'bg-green-500',
    },
    connecting: {
      icon: <Activity className="w-5 h-5 animate-pulse" />,
      label: 'Connecting',
      description: 'Establishing proxy connection',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
      dotColor: 'bg-blue-500',
    },
    disconnected: {
      icon: <WifiOff className="w-5 h-5" />,
      label: 'Disconnected',
      description: 'No proxy connection active',
      bgColor: 'bg-neutral-500/10',
      borderColor: 'border-neutral-500/20',
      textColor: 'text-neutral-600 dark:text-neutral-400',
      badgeColor: 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700/50',
      dotColor: 'bg-neutral-500',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      label: 'Connection Error',
      description: 'Failed to connect to proxy server',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      textColor: 'text-red-700 dark:text-red-300',
      badgeColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
      dotColor: 'bg-red-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-2">
      {/* Compact Status Bar */}
      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`${config.textColor} flex-shrink-0`}>
            {config.icon}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`font-medium text-sm ${config.textColor}`}>
              {config.label}
            </span>
            {status === 'connected' && latency !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.badgeColor}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${config.dotColor}`} />
                {latency}ms
              </span>
            )}
          </div>
        </div>
        
        {/* Expand Details Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1"
          onClick={() => setShowDetails(!showDetails)}
          title={showDetails ? 'Hide details' : 'Show details'}
        >
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              showDetails ? 'rotate-180' : ''
            }`}
          />
        </Button>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} space-y-2 animate-in fade-in duration-200`}>
          <p className="text-xs text-muted-foreground">
            {config.description}
          </p>
          {status === 'connected' && latency !== null && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Latency</p>
                <p className={`font-semibold ${config.textColor}`}>{latency}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className={`font-semibold ${config.textColor}`}>Healthy</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
