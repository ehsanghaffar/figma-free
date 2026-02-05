import { Activity, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react';
import { useConnectionStatus } from '../hooks/useProxy';
import type { ConnectionStatus } from '../types/proxy';

export function ConnectionStatusSection() {
  const { status, latency } = useConnectionStatus();

  const statusConfig: Record<ConnectionStatus, {
    icon: React.ReactNode;
    label: string;
    description: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    dotColor: string;
  }> = {
    connected: {
      icon: <CheckCircle2 className="w-8 h-8" />,
      label: 'Connected',
      description: 'Proxy is active and running smoothly',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-600 dark:text-green-400',
      dotColor: 'bg-green-500',
    },
    connecting: {
      icon: <Activity className="w-8 h-8 animate-pulse" />,
      label: 'Connecting',
      description: 'Establishing proxy connection',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      dotColor: 'bg-blue-500',
    },
    disconnected: {
      icon: <WifiOff className="w-8 h-8" />,
      label: 'Disconnected',
      description: 'No proxy connection active',
      bgColor: 'bg-neutral-500/10',
      borderColor: 'border-neutral-500/30',
      textColor: 'text-neutral-600 dark:text-neutral-400',
      dotColor: 'bg-neutral-500',
    },
    error: {
      icon: <AlertCircle className="w-8 h-8" />,
      label: 'Connection Error',
      description: 'Failed to connect to proxy server',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-600 dark:text-red-400',
      dotColor: 'bg-red-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg border p-6 ${config.bgColor} ${config.borderColor} transition-all duration-300`}>
      <div className="flex items-start gap-4">
        <div className={`${config.textColor} shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className={`text-lg font-semibold ${config.textColor}`}>
              {config.label}
            </h3>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
              {status === 'connected' && latency !== null ? `${latency}ms latency` : status}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}
