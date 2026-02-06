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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Figma Free</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <AboutTab />
        </div>
      </DialogContent>
    </Dialog>
  );
}
