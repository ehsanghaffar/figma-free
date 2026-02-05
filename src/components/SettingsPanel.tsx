import { Settings, Info } from 'lucide-react';
import { useSettingsStore } from '../store/proxyStore';
import { AdvancedTab, AboutTab } from './Settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

const tabs = [
  { id: 'advanced' as const, label: 'Advanced', icon: Settings },
  { id: 'about' as const, label: 'About', icon: Info },
];

export function SettingsPanel() {
  const { isOpen, activeTab, close, setTab } = useSettingsStore();

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setTab(value as 'advanced' | 'about')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="advanced" className="max-h-[60vh] overflow-y-auto">
            <AdvancedTab />
          </TabsContent>

          <TabsContent value="about" className="max-h-[60vh] overflow-y-auto">
            <AboutTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
