import { useSettingsStore } from '../store/proxyStore';
import { AboutTab } from './Settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export function SettingsPanel() {
  const { isOpen, close } = useSettingsStore();

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>About Figma Desktop</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <AboutTab />
        </div>
      </DialogContent>
    </Dialog>
  );
}
