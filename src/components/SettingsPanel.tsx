import { X, Wifi, Settings, Info } from 'lucide-react';
import { useSettingsStore } from '../store/proxyStore';
import { ProxyTab, AdvancedTab, AboutTab } from './Settings';

const tabs = [
  { id: 'proxy' as const, label: 'Proxy', icon: Wifi },
  { id: 'advanced' as const, label: 'Advanced', icon: Settings },
  { id: 'about' as const, label: 'About', icon: Info },
];

export function SettingsPanel() {
  const { isOpen, activeTab, close, setTab } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-200">Settings</h2>
          <button
            onClick={close}
            className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'proxy' && <ProxyTab />}
          {activeTab === 'advanced' && <AdvancedTab />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
}
