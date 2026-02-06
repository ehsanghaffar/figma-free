#  Figma Free

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](#)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?logo=tauri&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=061925)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](#)
[![Zustand](https://img.shields.io/badge/State-Zustand-000000)](#)

A lightweight, cross‑platform desktop wrapper for Figma with built‑in proxy and DNS capabilities. Configure SOCKS5/HTTP/HTTPS proxies, add optional DNS overrides and WebRTC protection, then launch Figma through a dedicated window that respects your network settings.

> Not affiliated with or endorsed by Figma, Inc. Use at your own risk.

---

## What It Does

- Launches Figma in a Tauri WebView configured to use your proxy
- Supports SOCKS5, HTTP and HTTPS proxies with optional authentication
- Optional DNS override and WebRTC leak protection
- Health checks, latency measurement, and connection status
- Secure credential storage via OS keychain
- System tray controls and keyboard shortcuts

Built with Tauri 2, React 19, Vite 6, TypeScript, Tailwind, and Zustand. Rust powers the proxy management, health checks and window creation.

---

## Why It’s Useful

- Bypass regional network restrictions that block or throttle Figma
- Keep your main system network untouched—route only Figma via the configured proxy
- One-click test, save, toggle and launch flow
- Small footprint, native feel, and fast startup times

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Rust stable toolchain and Cargo
- Tauri system dependencies
  - macOS: Xcode command line tools
  - Windows: Visual Studio Build Tools + WebView2
  - Linux: GTK3 + webkit2gtk (see Tauri docs)

### Install

```bash
pnpm install
```

### Run (Desktop App)

Tauri will start Vite on port 1420 and launch the desktop app.

```bash
pnpm tauri dev
```

### Build (Production)

Creates platform installers/bundles under `src-tauri/target`.

```bash
pnpm tauri build
```

### Optional: Web Preview (UI only)

Runs the web UI without the Tauri backend (limited functionality).

```bash
pnpm dev
```

---

## Usage

1. Open the app (system tray available)
2. Configure your proxy:
   - Type: `socks5`, `http`, or `https`
   - Host/Port, optional username/password
3. Test connection to verify latency and external IP
4. Save and enable the proxy
5. Optionally set advanced options:
   - Custom DNS server
   - WebRTC protection
   - Kill switch and auto‑update preferences
6. Click “Launch Figma” to open a dedicated window routed through your settings

### Keyboard Shortcuts

- Cmd/Ctrl + , — Open About/Settings
- Cmd/Ctrl + Shift + P — Toggle proxy
- Esc — Close dialogs

---

## Project Structure

- `src/` — React UI (Home screen, proxy/DNS config, status, tray interactions)
- `src-tauri/` — Rust backend (proxy manager, health checks, commands, window creation)
- `docs/` — Project notes and issue tracking

Key backend commands (invoked from the UI):
- `set_proxy_config`, `get_proxy_config`, `toggle_proxy`, `get_proxy_status`
- `test_proxy_connection`, `trigger_health_check`
- `save_advanced_settings`, `get_advanced_settings`
- `create_figma_window`, `clear_cache`, `get_app_version`, `is_first_run`

---

## Scripts

- `pnpm tauri dev`: Run the desktop app in development
- `pnpm tauri build`: Build installers/bundles
- `pnpm dev`: Run Vite dev server (UI only)
- `pnpm build`: Type-check and build UI assets
- `pnpm preview`: Preview built UI (UI only)

---

## Support & Docs

- Known bugs and open issues: [docs/BUGS_AND_ISSUES.md](docs/BUGS_AND_ISSUES.md)
- Fixes applied and progress: [docs/FIXES_APPLIED.md](docs/FIXES_APPLIED.md)
- Potential issues to watch: [docs/potential-issues.md](docs/potential-issues.md)
- Notes and experiments: [docs/GEMINI.md](docs/GEMINI.md)
- File issues and feature requests in the repository issues page.

Repository: https://github.com/ehsanghaffar/figma-free

---

## Maintainers & Contributing

- Maintainer: Ehsan Ghaffar (Ein) — https://github.com/ehsanghaffar
- Contributions welcome! Suggested flow:
  - Fork and create a feature branch
  - `pnpm install` and `pnpm tauri dev` to iterate locally
  - Keep changes focused; add minimal docs in `docs/` when relevant
  - Open a PR with a clear description and screenshots when UI changes

---

## Security & Privacy

- Credentials are stored securely using the OS keychain; the UI never persists passwords directly.
- Network access is restricted by a strict Content Security Policy and the Tauri permission model.

---

## Tech Stack

- Desktop: Tauri 2 (Rust) + WebView [Tauri](https://tauri.app/)
- UI: React 19 + Vite 6 + Tailwind 4 + shadcn/radix primitives
- State: Zustand
- Networking: `reqwest` with proxy configuration and health checks

