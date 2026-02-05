import { useConnectionStatus } from '../hooks/useProxy';
import { Badge } from './ui/badge';
import type { ConnectionStatus } from '../types/proxy';

interface StatusIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showLatency?: boolean;
}

const statusConfig: Record<ConnectionStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  connected: {
    variant: 'default',
    label: 'Connected',
  },
  connecting: {
    variant: 'secondary',
    label: 'Connecting...',
  },
  disconnected: {
    variant: 'outline',
    label: 'Disconnected',
  },
  error: {
    variant: 'destructive',
    label: 'Error',
  },
};

const sizeConfig = {
  sm: {
    dot: 'w-2 h-2',
    text: 'text-xs',
  },
  md: {
    dot: 'w-2.5 h-2.5',
    text: 'text-sm',
  },
  lg: {
    dot: 'w-3 h-3',
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
    <Badge variant={config.variant} className="flex items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <span className={`${sizes.dot} rounded-full bg-current`} />
        {status === 'connecting' && (
          <span className={`absolute ${sizes.dot} rounded-full bg-current animate-pulse`} />
        )}
      </div>
      
      {showLabel && (
        <span className={sizes.text}>
          {config.label}
        </span>
      )}
      
      {showLatency && latency !== null && status === 'connected' && (
        <span className={`${sizes.text} opacity-75`}>
          {latency}ms
        </span>
      )}
    </Badge>
  );
}
