import { Figma } from "lucide-react";
import { useConnectionStatus, useSettingsListener, useKeyboardShortcuts, useAdvancedSettings } from "../hooks/useProxy";
import { useProxyStore } from "../store/proxyStore";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { ConnectionStatusSection } from "./ConnectionStatusSection";
import { ProxyConfigSection } from "./ProxyConfigSection";
import { DNSConfigSection } from "./DNSConfigSection";
import { toast } from "sonner";
import { message } from '@tauri-apps/plugin-dialog';


export function HomeScreen() {
  // Initialize hooks
  useKeyboardShortcuts();
  useSettingsListener();

  const { status } = useConnectionStatus();
  const config = useProxyStore((state) => state.config);
  const { DNSStatus } = useAdvancedSettings();

  const isLaunchEnabled = () => {
    const hasValidDNS = typeof DNSStatus === 'string' && DNSStatus.length > 0;
    const hasValidProxy = config.enabled && status === "connected";
    return hasValidProxy || hasValidDNS;
  };

  const launchFigma = async () => {
    try {
      const scheme = config.type === "https" ? "http" : config.type || "http";
      const host = config.host || "127.0.0.1";
      const port = config.port || 1080;
      const proxy = `${scheme}://${host}:${port}`;
      await invoke("create_figma_window", { proxy });
    } catch (err) {
      toast.error("Failed to launch Figma", {
        description: String(err),
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main Content Area - Compact Layout */}
      <div className="flex-1 overflow-auto">
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
            {/* Header - Compact */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src="/figma-icon.svg"
                  alt="Figma"
                  className="size-3"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <h1 className="text-2xl font-bold">Figma Free</h1>
              </div>
              <p className="text-xs text-muted-foreground">Quick access to proxy configuration and Figma launcher</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Connection Status - Inline */}
              <div className="shrink-0">
                <ConnectionStatusSection />
              </div>

              {/* Configuration Card with Tabs */}
              <Card className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
                <Tabs defaultValue="proxy">
                  <TabsList className="grid w-full grid-cols-2 gap-2 content-center border-b rounded-b-none p-1">
                    <TabsTrigger value="proxy">
                      <span>Proxy</span>
                      {config.enabled && <span className="text-xs font-medium text-green-600 dark:text-green-400">●</span>}
                    </TabsTrigger>
                    <TabsTrigger value="dns">
                      <span>DNS</span>
                    </TabsTrigger>
                  </TabsList>
                  <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                    <TabsContent value="proxy" className="flex-1 overflow-auto p-2 m-0">
                      <ProxyConfigSection />
                    </TabsContent>

                    <TabsContent value="dns" className="flex-1 overflow-auto p-2 m-0">
                      <DNSConfigSection />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>

              {/* Quick Actions */}
              <div className="shrink-0 flex gap-2">
                <Button
                  size="lg"
                  onClick={launchFigma}
                  title={status !== "connected" ? "Connect proxy successfully to enable" : "Open Figma"}
                  className="flex-1 gap-2"
                  disabled={!isLaunchEnabled()}
                >
                  <Figma className="size-5" />
                  Launch Figma
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
