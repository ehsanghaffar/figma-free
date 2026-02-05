import { Minus, Square, X, Settings } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore } from '../store/proxyStore';
import { StatusIndicator } from './StatusIndicator';
import { Button } from './ui/button';

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

  const handleClose = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent the default close behavior
    await appWindow.hide();

  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 flex items-center justify-between px-2 select-none "
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
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => settingsStore.open()}
          title="Settings (Cmd+,)"
          className="h-8 w-8 p-0"
        >
          <Settings className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-4 bg-neutral-700 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          title="Minimize"
          className="h-8 w-8 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaximize}
          title="Maximize"
          className="h-8 w-8 p-0"
        >
          <Square className="w-3.5 h-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          title="Close to Tray"
          className="h-8 w-8 p-0 hover:bg-red-600 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
