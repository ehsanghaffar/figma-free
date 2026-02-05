# Bugs/Issues and Possible Fixes (Tauri + React)

Date: 2026-02-05

## Tauri (Rust) issues

1) Tray icon likely disappears because the last `TrayIcon` handle is dropped
- Evidence: `setup_system_tray` builds a tray icon into a local `_tray` variable and then returns, so the last reference is dropped. In Tauri, tray icons are reference-counted and **removed when the last instance is dropped**. citeturn0search1
- Impact: On app start the tray icon may vanish immediately, breaking “close to tray” behavior.
- Possible fix: store the `TrayIcon` handle in app state (e.g., `AppState`), or keep it in a `static`/`OnceCell` so it lives for the app lifetime.
- File: `src-tauri/src/lib.rs`

2) `proxy_url` rejects `https://` proxy URLs
- Evidence: Tauri’s `proxy_url` **only accepts `http://` or `socks5://` URLs**. citeturn0search2turn0search4
- Impact: If the user selects “HTTPS” in the UI, `create_figma_window` builds `https://host:port`, which will fail and prevent the window from opening.
- Possible fix: map the UI’s “HTTPS” option to `http://` for proxy URL purposes (HTTP CONNECT), or disable the HTTPS option with a validation error before calling `create_figma_window`.
- Files: `src-tauri/src/commands.rs`, `src/App.tsx`, `src/components/Settings/ProxyTab.tsx`

3) CSP is explicitly disabled (`csp: null`)
- Evidence: Tauri’s CSP is a primary defense against XSS and is only enabled when configured; the config allows `csp` to be `null`. citeturn0search0turn0search3
- Impact: The app loads remote content (Figma) and also injects scripts; without a CSP this increases risk of malicious script injection.
- Possible fix: set a restrictive CSP (or at least a safer devCsp/csp split) and only allow the required hosts and protocols.
- File: `src-tauri/tauri.conf.json`

4) Creating the Figma window multiple times can fail
- Evidence: `create_figma_window` always uses the label `"figma_main"`. Tauri window labels must be unique; building another window with the same label errors.
- Impact: Repeated “Open Figma” clicks can error after the first window is created.
- Possible fix: check for an existing window by label and focus it, or generate a unique label if multiple windows are allowed.
- File: `src-tauri/src/commands.rs`

5) `toggle_proxy` can enable an invalid configuration
- Evidence: `toggle_proxy` only flips the `enabled` flag. It does not validate or rebuild the client, so toggling via tray can enable a proxy with empty host/port.
- Impact: UI shows “enabled,” but requests fail (`ProxyError::NotConfigured`).
- Possible fix: when enabling, validate config and rebuild client (or reject with an error if config invalid).
- File: `src-tauri/src/proxy/manager.rs`

6) `clear_cache` is a no-op but the UI promises sign-out
- Evidence: command handler returns `Ok(())` without clearing any WebView data.
- Impact: Users click “Clear Cache & Cookies” expecting sign-out, but nothing changes.
- Possible fix: implement WebView cache/cookie clearing via Tauri APIs, or change the UI text to avoid misleading behavior.
- File: `src-tauri/src/commands.rs`, `src/components/Settings/AdvancedTab.tsx`

7) “First run” and “advanced settings” are not persisted
- Evidence: `AppState.is_first_run` and `advanced_settings` live only in memory. There’s no use of the store plugin to persist them.
- Impact: On every restart, the app behaves as “first run” and advanced settings revert to defaults.
- Possible fix: use `tauri-plugin-store` to persist these values and load them on startup.
- Files: `src-tauri/src/lib.rs`, `src-tauri/src/commands.rs`

8) Password deletion isn’t handled when users clear password fields
- Evidence: `set_proxy_config` only stores a password when non-empty and never deletes existing credentials if the user clears the password.
- Impact: Old credentials remain in the OS keyring and may be used unexpectedly.
- Possible fix: when password is empty (or username removed), call `delete_proxy_credentials` and clear the keyring entry.
- Files: `src-tauri/src/commands.rs`, `src-tauri/src/utils/crypto.rs`

9) Figma request override breaks API calls
- Evidence: `initialization_script` replaces API calls to `api.figma.com` with `https://www.figma.com/`, which is not the API endpoint.
- Impact: API calls return the homepage instead of JSON, which can break the app or login flows.
- Possible fix: remove the override, or implement a proper proxy routing layer rather than rewriting URLs.
- File: `src-tauri/src/commands.rs`

## React (frontend) issues

1) Empty password handling can break proxy URLs
- Evidence: the password input stores `""` into state. Backend URL building treats `Some("")` as a real password and builds `user:@host:port`.
- Impact: Proxy auth can fail even when users mean “no password.”
- Possible fix: normalize empty strings to `undefined` for both `username` and `password` before sending to the backend.
- Files: `src/components/Settings/ProxyTab.tsx`, `src/store/proxyStore.ts`

2) HTTPS proxy option conflicts with backend capabilities
- Evidence: UI allows HTTPS proxy type, but the backend’s window-level proxy support only accepts `http://` or `socks5://`. citeturn0search2turn0search4
- Impact: user selects HTTPS and Figma launch fails.
- Possible fix: disable HTTPS in the UI or translate it to HTTP (CONNECT) when building the proxy URL.
- Files: `src/components/Settings/ProxyTab.tsx`, `src/App.tsx`

3) “Open Figma” can be used with an untested/invalid proxy
- Evidence: button is enabled if `status === 'connected'`, but `status` relies on health checks and can lag behind recent config changes.
- Impact: user might open a window with outdated proxy config.
- Possible fix: after Save & Apply, re-check status or require a successful test in the same session before enabling the button.
- Files: `src/App.tsx`, `src/hooks/useProxy.ts`, `src/components/Settings/ProxyTab.tsx`

## Suggested next steps

- Prioritize fixing tray icon lifetime and `proxy_url` scheme validation (core functionality).
- Add persistence using `tauri-plugin-store` for advanced settings and first-run status.
- Implement a real cache-clearing command or change UI copy.
- Normalize empty credentials on the frontend and clear keyring entries on the backend.
- Remove or rework the API URL override in `create_figma_window`.
