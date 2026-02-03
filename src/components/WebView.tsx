import { useState } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const FIGMA_URL = 'https://www.figma.com';

interface WebViewProps {
  className?: string;
}

export function WebView({ className = '' }: WebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load Figma. Please check your connection and proxy settings.');
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Force iframe reload
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 z-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-neutral-400">Loading Figma...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 z-10">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-sm text-neutral-300 mb-4 text-center max-w-md">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Figma iframe */}
      <iframe
        src={FIGMA_URL}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
        allow="clipboard-read; clipboard-write; fullscreen"
        title="Figma"
      />
    </div>
  );
}
