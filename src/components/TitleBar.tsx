import { Minus, Square, X, Settings } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore } from '../store/proxyStore';
import { StatusIndicator } from './StatusIndicator';

export function TitleBar() {
  const settingsStore = useSettingsStore();
  const appWindow = getCurrentWindow();

  const handleMinimize = async () => {
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  };

  const handleClose = async () => {
    await appWindow.hide();
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 bg-neutral-900 flex items-center justify-between px-2 select-none border-b border-neutral-800"
    >
      {/* Left section - App title and status */}
      <div className="flex items-center gap-3" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <img src="/figma-icon.svg" alt="Figma" className="w-5 h-5" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          <span className="text-sm font-medium text-neutral-300">Figma Desktop</span>
        </div>
        <StatusIndicator size="sm" />
      </div>

      {/* Right section - Window controls */}
      <div className="flex items-center">
        <button
          onClick={() => settingsStore.open()}
          className="p-2 hover:bg-neutral-800 rounded transition-colors"
          title="Settings (Cmd+,)"
        >
          <Settings className="w-4 h-4 text-neutral-400" />
        </button>
        
        <div className="w-px h-4 bg-neutral-700 mx-1" />
        
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-neutral-800 rounded transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-neutral-400" />
        </button>
        
        <button
          onClick={handleMaximize}
          className="p-2 hover:bg-neutral-800 rounded transition-colors"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5 text-neutral-400" />
        </button>
        
        <button
          onClick={handleClose}
          className="p-2 hover:bg-red-600 rounded transition-colors group"
          title="Close to Tray"
        >
          <X className="w-4 h-4 text-neutral-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
