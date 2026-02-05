import { Figma, Wifi } from "lucide-react";
import { useConnectionStatus, useSettingsListener, useKeyboardShortcuts } from "../hooks/useProxy";
import { useProxyStore } from "../store/proxyStore";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ConnectionStatusSection } from "./ConnectionStatusSection";
import { ProxyConfigSection } from "./ProxyConfigSection";
import { DNSConfigSection } from "./DNSConfigSection";

export function HomeScreen() {
  // Initialize hooks
  useKeyboardShortcuts();
  useSettingsListener();

  const { status } = useConnectionStatus();
  const config = useProxyStore((state) => state.config);

  const launchFigma = async () => {
    try {
      const scheme = config.type === "https" ? "http" : config.type || "http";
      const host = config.host || "127.0.0.1";
      const port = config.port || 1080;
      const proxy = `${scheme}://${host}:${port}`;
      await invoke("create_figma_window", { proxy });
    } catch (err) {
      alert("Failed to launch: " + err);
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
                <img src="/figma-icon.svg" alt="Figma" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <h1 className="text-lg font-bold">Figma Desktop</h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Quick access to proxy configuration and Figma launcher
              </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Connection Status - Inline */}
              <div className="flex-shrink-0">
                <ConnectionStatusSection />
              </div>

              {/* Configuration Card */}
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="py-3 px-6">
                  <CardTitle className="text-sm font-semibold">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto py-0 px-6 pb-6">
                  <Accordion type="single" collapsible defaultValue="proxy" className="w-full">
                    {/* Proxy Configuration */}
                    <AccordionItem value="proxy" className="border-b">
                      <AccordionTrigger className="hover:no-underline py-3 px-0">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-blue-100 dark:bg-blue-950 rounded text-blue-600 dark:text-blue-400">
                            <Wifi className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">Proxy</p>
                            <p className="text-xs text-muted-foreground">{config.enabled ? "Enabled" : "Disabled"}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 py-3 bg-transparent">
                        <ProxyConfigSection />
                      </AccordionContent>
                    </AccordionItem>

                    {/* DNS & Header Configuration */}
                    <AccordionItem value="dns" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-3 px-0">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-purple-100 dark:bg-purple-950 rounded text-purple-600 dark:text-purple-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">DNS & Headers</p>
                            <p className="text-xs text-muted-foreground">Advanced</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 py-3 bg-transparent">
                        <DNSConfigSection />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex-shrink-0 flex gap-2">
                <Button
                  size="sm"
                  onClick={launchFigma}
                  disabled={status !== "connected"}
                  title={status !== "connected" ? "Connect proxy successfully to enable" : "Open Figma"}
                  className="flex-1 gap-2"
                >
                  <Figma className="w-4 h-4" />
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
