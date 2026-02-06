import { ExternalLink, Figma, Github, Heart } from "lucide-react";
import { useAppStore } from "../../store/proxyStore";
import { Button } from "../ui/button";

export function AboutTab() {
  const { appVersion } = useAppStore();

  return (
    <div className="space-y-6">
      {/* App Info */}
      <div className="text-center py-2">
        <img src="/figma.png" alt="Figma Logo" className="size-12 mx-auto mb-2" />
        <h2 className="text-xl font-semibold ">Figma Free</h2>
        <p className="text-sm text-neutral-500">Version {appVersion}</p>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-400 leading-relaxed">
        Figma Free is an open-source desktop application that provides secure and private access to Figma by routing traffic
        through a local proxy. It is designed to enhance your Figma experience while ensuring your data remains safe and your
        connection is optimized.
      </p>

      {/* Features */}
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-3">Features</h3>
        <ul className="space-y-2 text-sm text-neutral-400">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            SOCKS5, HTTP, and HTTPS proxy support
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Secure credential storage
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            WebRTC leak protection
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Connection health monitoring
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            System tray integration
          </li>
        </ul>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full flex items-center justify-between" asChild>
          <a href="https://github.com/ehsanghaffar" target="_blank" rel="noopener noreferrer">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5" />
              <span>View on GitHub</span>
            </div>
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>

        <Button variant="outline" className="w-full flex items-center justify-between" asChild>
          <a href="https://www.figma.com" target="_blank" rel="noopener noreferrer">
            <div className="flex items-center gap-3">
              <span className="text-lg">F</span>
              <span>Visit Figma</span>
            </div>
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>

      {/* Legal */}
      <div className="pt-4 border-t border-neutral-800">
        <p className="text-xs text-neutral-600 text-center leading-relaxed">
          This application is provided as-is without warranty. Use at your own risk. Figma is a trademark of Figma, Inc. This
          project is not affiliated with or endorsed by Figma, Inc.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1 text-xs text-neutral-600">
        <span>Made with</span>
        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
        <span>using Tauri + React</span>
      </div>
    </div>
  );
}
