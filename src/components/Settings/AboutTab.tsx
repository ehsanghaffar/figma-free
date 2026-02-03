import { ExternalLink, Github, Heart } from 'lucide-react';
import { useAppStore } from '../../store/proxyStore';

export function AboutTab() {
  const { appVersion } = useAppStore();

  return (
    <div className="space-y-6">
      {/* App Info */}
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">F</span>
        </div>
        <h2 className="text-xl font-semibold text-neutral-200">Figma Desktop</h2>
        <p className="text-sm text-neutral-500">Version {appVersion}</p>
      </div>

      {/* Description */}
      <div className="bg-neutral-800/50 rounded-lg p-4">
        <p className="text-sm text-neutral-400 leading-relaxed">
          A desktop wrapper for Figma with built-in proxy support, enabling access
          in regions with network restrictions. This is an unofficial application
          not affiliated with Figma, Inc.
        </p>
      </div>

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
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-neutral-400" />
            <span className="text-sm text-neutral-300">View on GitHub</span>
          </div>
          <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        </a>

        <a
          href="https://www.figma.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 text-lg">F</span>
            <span className="text-sm text-neutral-300">Visit Figma</span>
          </div>
          <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        </a>
      </div>

      {/* Legal */}
      <div className="pt-4 border-t border-neutral-800">
        <p className="text-xs text-neutral-600 text-center leading-relaxed">
          This application is provided as-is without warranty. Use at your own risk.
          Figma is a trademark of Figma, Inc. This project is not affiliated with
          or endorsed by Figma, Inc.
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
