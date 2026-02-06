# Codebase Review: Bugs, Issues, and Suggested Updates

Date: 2026-02-06

## Summary
- Critical: 2
- High: 3
- Medium: 4
- Low: 2

## Critical Issues

### 1) Figma launch always uses a proxy, even when proxy is disabled (and ignores auth)
**Location:** `src/components/HomeScreen.tsx:23-35`, `src-tauri/src/commands.rs:182-216`

**What happens:** `isLaunchEnabled()` allows launching when DNS is set even if the proxy is disabled, but `launchFigma()` always builds a proxy URL and passes it to `create_figma_window`. If the proxy is disabled or host is empty, this yields an invalid proxy URL. Additionally, the URL never includes username/password, so authenticated proxies won’t work for the Figma window.

**Impact:** Launching Figma can fail or route incorrectly; authenticated proxy setups won’t work in the webview.

**Suggested update:** Only pass a proxy when `config.enabled` is true and validated. If you want DNS-only mode, allow `create_figma_window` to accept an optional/empty proxy. For auth proxies, fetch credentials from the backend (keyring) or build the URL server-side.

### 2) Proxy manager builds a proxy client even when disabled
**Location:** `src-tauri/src/proxy/manager.rs:56-80`

**What happens:** `configure()` always builds a proxy URL/client even if `config.enabled` is false. A disabled config with empty host or invalid URL can still fail here.

**Impact:** Saving a disabled config can error or create a misleading “configured” client. This also makes it harder to store configs without enabling them.

**Suggested update:** If `config.enabled` is false, skip proxy creation, clear any existing client, and only persist the config.

## High Priority Issues

### 3) Settings persistence mismatch (frontend persists, backend overwrites)
**Location:** `src/store/proxyStore.ts:86-175, 185-190`, `src-tauri/src/commands.rs:131-146`, `src-tauri/src/lib.rs:40-46`

**What happens:** The frontend persists config/advanced settings to localStorage, but on startup `loadConfig()`/`loadAdvancedSettings()` overwrite them with backend defaults. The backend stores advanced settings only in memory.

**Impact:** Settings appear to save but reset on restart; persisted localStorage state is effectively ignored.

**Suggested update:** Either (a) persist settings on the backend (tauri-plugin-store) and treat it as source of truth, or (b) remove backend loads and rely on frontend persistence.

### 4) Proxy password can be stored in localStorage
**Location:** `src/store/proxyStore.ts:185-190`

**What happens:** Zustand persistence stores `config` wholesale, which can include the proxy password if it’s set in state.

**Impact:** Sensitive data can be stored unencrypted in localStorage.

**Suggested update:** Exclude `password` from persisted state (or store a redacted config) and rely solely on keyring storage.

### 5) Advanced settings are saved but not applied
**Location:** `src/components/Settings/AdvancedTab.tsx`, `src/components/DNSConfigSection.tsx`, `src-tauri/src/network/interceptor.rs`, `src-tauri/src/commands.rs:131-146`, `src-tauri/src/commands.rs:207-216`

**What happens:** Custom DNS, WebRTC protection, kill switch, and custom user agent are stored but never applied to the WebView or network layer. `create_figma_window()` uses a hardcoded user agent.

**Impact:** Advanced settings appear to work but are effectively no-ops.

**Suggested update:** Wire advanced settings into window creation (user agent), the injected scripts (WebRTC protection), and proxy/DNS behavior. If a setting isn’t supported yet, hide/disable it.

## Medium Priority Issues

### 6) Startup error handling never triggers
**Location:** `src/store/proxyStore.ts:86-99`, `src/App.tsx:14-20`

**What happens:** `loadConfig()` resolves with an Error object instead of throwing, so `App.tsx`’s `.catch()` never runs.

**Impact:** Startup failures can be silently ignored, and the user never sees the error dialog.

**Suggested update:** Re-throw after setting the error state, or return a `Result` object and handle it explicitly in `App.tsx`.

### 7) DNS/Custom headers UI conflates settings and clears user agent
**Location:** `src/components/DNSConfigSection.tsx:18-56, 113-126`

**What happens:** The UI label says “Custom User-Agent” while the helper text says JSON headers, and the value is stored in `customUserAgent`. Disabling DNS clears the user agent even if the user only wanted to disable DNS.

**Impact:** Confusing UX and unintended data loss.

**Suggested update:** Separate `customHeaders` from `customUserAgent`, use a dedicated setting for headers, and don’t clear user agent when toggling DNS.

### 8) Proxy URL builder does not percent-encode credentials
**Location:** `src-tauri/src/proxy/config.rs:105-112`

**What happens:** Username/password are inserted directly into the URL without encoding.

**Impact:** Auth proxies fail when credentials include special characters (`@`, `:`, `/`, etc.).

**Suggested update:** Build URLs with `url::Url` or percent-encode user/pass.

### 9) Auto-connect/auto-detect flags are unused
**Location:** `src/components/Settings/ProxyTab.tsx:197-210`, `src/types/proxy.ts`, `src-tauri/src/proxy/config.rs`

**What happens:** The UI exposes an auto-connect toggle, but no startup logic reads or applies it.

**Impact:** Users see a setting that has no effect.

**Suggested update:** Implement startup auto-connect (e.g., after config load), or remove the toggle until supported.

## Low Priority Issues / Suggestions

### 10) Health check endpoint fixed to Google
**Location:** `src-tauri/src/proxy/health.rs:25-32`

**Impact:** False negatives in regions where Google is blocked.

**Suggested update:** Make the endpoint configurable or add multiple fallbacks.

### 11) Settings panel ignores tabs and only shows About
**Location:** `src/components/SettingsPanel.tsx:10-21`

**Impact:** Settings button opens an About-only dialog; Proxy/Advanced tabs are unused.

**Suggested update:** Add tabbed content or rename the panel to “About” to match behavior.
