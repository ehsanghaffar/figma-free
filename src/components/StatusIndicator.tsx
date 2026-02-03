import { useConnectionStatus } from '../hooks/useProxy';
import type { ConnectionStatus } from '../types/proxy';

interface StatusIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showLatency?: boolean;
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string; bgColor: string }> = {
  connected: {
    color: 'bg-green-500',
    bgColor: 'bg-green-500/20',
    label: 'Connected',
  },
  connecting: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/20',
    label: 'Connecting...',
  },
  disconnected: {
    color: 'bg-neutral-500',
    bgColor: 'bg-neutral-500/20',
    label: 'Disconnected',
  },
  error: {
    color: 'bg-red-500',
    bgColor: 'bg-red-500/20',
    label: 'Error',
  },
};

const sizeConfig = {
  sm: {
    dot: 'w-2 h-2',
    container: 'px-2 py-1',
    text: 'text-xs',
  },
  md: {
    dot: 'w-2.5 h-2.5',
    container: 'px-3 py-1.5',
    text: 'text-sm',
  },
  lg: {
    dot: 'w-3 h-3',
    container: 'px-4 py-2',
    text: 'text-base',
  },
};

export function StatusIndicator({ 
  size = 'md', 
  showLabel = true, 
  showLatency = true 
}: StatusIndicatorProps) {
  const { status, latency } = useConnectionStatus();
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className={`flex items-center gap-2 ${config.bgColor} rounded-full ${sizes.container}`}>
      <div className="relative flex items-center justify-center">
        <span className={`${sizes.dot} rounded-full ${config.color}`} />
        {status === 'connecting' && (
          <span className={`absolute ${sizes.dot} rounded-full ${config.color} animate-ping`} />
        )}
      </div>
      
      {showLabel && (
        <span className={`${sizes.text} text-neutral-300 font-medium`}>
          {config.label}
        </span>
      )}
      
      {showLatency && latency !== null && status === 'connected' && (
        <span className={`${sizes.text} text-neutral-500`}>
          {latency}ms
        </span>
      )}
    </div>
  );
}

// Compact version for title bar
export function StatusDot() {
  const { status } = useConnectionStatus();
  const config = statusConfig[status];

  return (
    <div className="relative flex items-center justify-center" title={config.label}>
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      {status === 'connecting' && (
        <span className={`absolute w-2 h-2 rounded-full ${config.color} animate-ping`} />
      )}
    </div>
  );
}
