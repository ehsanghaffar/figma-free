import { Figma, Wifi } from "lucide-react";
import { useConnectionStatus, useSettingsListener, useKeyboardShortcuts } from "../hooks/useProxy";
import { useProxyStore } from "../store/proxyStore";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Figma className="size-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-xl font-bold">Figma Desktop</h1>
            </div>
            <p className="text-muted-foreground text-xs">Configure your proxy settings to access Figma with network restrictions</p>
          </div>

          <div className="space-y-3">
            {/* Connection Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ConnectionStatusSection />
              </CardContent>
            </Card>

            {/* Configuration Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
                <CardDescription>Set up your proxy and DNS settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="proxy" className="w-full">
                  {/* Proxy Configuration */}
                  <AccordionItem value="proxy" className="border-b">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-950 rounded">
                          <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">Proxy Configuration</p>
                          <p className="text-xs text-muted-foreground">{config.enabled ? "Proxy enabled" : "Proxy disabled"}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-muted/30">
                      <ProxyConfigSection />
                    </AccordionContent>
                  </AccordionItem>

                  {/* DNS & Header Configuration */}
                  <AccordionItem value="dns" className="border-b">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-950 rounded">
                          <svg
                            className="w-4 h-4 text-purple-600 dark:text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z"
                            />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">DNS & Headers</p>
                          <p className="text-xs text-muted-foreground">Advanced network settings</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-muted/30">
                      <DNSConfigSection />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Launch Button */}
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={launchFigma}
                disabled={status !== "connected"}
                title={status !== "connected" ? "Connect proxy successfully to enable" : "Open Figma"}
                className="flex-1 gap-2"
              >
                <Figma className="w-5 h-5" />
                Launch Figma
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Tip:</span> Make sure your proxy configuration is correct and the connection
                status shows <span className="font-medium">Connected</span> before launching Figma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
