//! Tauri commands for proxy and application control
//! These commands are invoked from the frontend
use crate::network::WEBRTC_PROTECTION_SCRIPT;
use crate::proxy::{ProxyConfig, ProxyPreset, ProxyStatus, ProxyTestResult, ProxyType};
use crate::utils::{
    delete_proxy_password, get_proxy_password, store_proxy_password, AdvancedSettings, STORE_FILENAME,
};
use crate::{utils::keys, AppState};
use tauri::{Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_store::StoreBuilder;
use url::Url;

/// Set proxy configuration
#[tauri::command]
pub async fn set_proxy_config(
    config: ProxyConfig,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    log::info!("Setting proxy config: {:?}", config.host);

    // Store or clear password securely if provided
    if let Some(ref password) = config.password {
        if !password.is_empty() {
            store_proxy_password(&config.host, config.port, password)
                .map_err(|e| format!("Failed to store password: {}", e))?;
        } else if !config.host.is_empty() {
            let _ = delete_proxy_password(&config.host, config.port);
        }
    } else if config.username.is_none() && !config.host.is_empty() {
        let _ = delete_proxy_password(&config.host, config.port);
    }

    // Configure proxy manager
    state
        .proxy_manager
        .configure(config.clone())
        .await
        .map_err(|e| e.to_string())?;

    // Persist config (do not store password)
    let store = StoreBuilder::new(&app, STORE_FILENAME)
        .build()
        .map_err(|e| e.to_string())?;
    let mut persisted = config;
    persisted.password = None;
    let value = serde_json::to_value(persisted).map_err(|e| e.to_string())?;
    store.set(keys::PROXY_CONFIG, value);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Test proxy connection
#[tauri::command]
pub async fn test_proxy_connection(
    config: ProxyConfig,
    state: State<'_, AppState>,
) -> Result<ProxyTestResult, String> {
    log::info!(
        "Testing proxy connection to {}:{}",
        config.host,
        config.port
    );

    // Get password from keyring if not provided
    let config = if config.username.is_some() && config.password.is_none() {
        let password = get_proxy_password(&config.host, config.port).ok();
        ProxyConfig { password, ..config }
    } else {
        config
    };

    let result = state.proxy_manager.test_connection(&config).await;
    Ok(result)
}

/// Get current proxy status
#[tauri::command]
pub async fn get_proxy_status(state: State<'_, AppState>) -> Result<ProxyStatus, String> {
    Ok(state.proxy_manager.get_status().await)
}

/// Toggle proxy on/off
#[tauri::command]
pub async fn toggle_proxy(
    enabled: bool,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    log::info!("Toggling proxy: {}", enabled);
    if enabled {
        let mut config = state.proxy_manager.get_config().await;
        if config.username.is_some() && config.password.is_none() {
            let password = get_proxy_password(&config.host, config.port).ok();
            config.password = password;
        }
        state
            .proxy_manager
            .configure(config)
            .await
            .map_err(|e| e.to_string())?;
    } else {
        state
            .proxy_manager
            .toggle(false)
            .await
            .map_err(|e| e.to_string())?;
    }

    // Persist enabled flag change
    let store = StoreBuilder::new(&app, STORE_FILENAME)
        .build()
        .map_err(|e| e.to_string())?;
    let mut config = state.proxy_manager.get_config().await;
    config.password = None;
    let value = serde_json::to_value(config).map_err(|e| e.to_string())?;
    store.set(keys::PROXY_CONFIG, value);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Get current proxy configuration
#[tauri::command]
pub async fn get_proxy_config(state: State<'_, AppState>) -> Result<ProxyConfig, String> {
    let mut config = state.proxy_manager.get_config().await;
    config.password = None;
    Ok(config)
}

/// Delete stored proxy credentials
#[tauri::command]
pub async fn delete_proxy_credentials(host: String, port: u16) -> Result<(), String> {
    delete_proxy_password(&host, port).map_err(|e| format!("Failed to delete credentials: {}", e))
}

/// Check URL interception (called from injected JS)
#[tauri::command]
pub async fn should_intercept_url(url: String, state: State<'_, AppState>) -> Result<bool, String> {
    let config = state.interceptor_config.read().await;
    Ok(config.should_intercept(&url))
}

/// Get proxy presets
#[tauri::command]
pub async fn get_proxy_presets() -> Result<Vec<ProxyPreset>, String> {
    // Return some example presets - in production these would come from storage or API
    Ok(vec![ProxyPreset {
        name: "Custom Server".to_string(),
        proxy_type: ProxyType::Socks5,
        host: String::new(),
        port: 1080,
        requires_auth: false,
        location: None,
    }])
}

/// Save advanced settings
#[tauri::command]
pub async fn save_advanced_settings(
    settings: AdvancedSettings,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    log::info!("Saving advanced settings");
    *state.advanced_settings.write().await = settings;
    let store = StoreBuilder::new(&app, STORE_FILENAME)
        .build()
        .map_err(|e| e.to_string())?;
    let value = serde_json::to_value(state.advanced_settings.read().await.clone())
        .map_err(|e| e.to_string())?;
    store.set(keys::ADVANCED_SETTINGS, value);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

/// Get advanced settings
#[tauri::command]
pub async fn get_advanced_settings(state: State<'_, AppState>) -> Result<AdvancedSettings, String> {
    Ok(state.advanced_settings.read().await.clone())
}

/// Trigger manual health check
#[tauri::command]
pub async fn trigger_health_check(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(state.health_monitor.check_health().await)
}

/// Clear application cache
#[tauri::command]
pub async fn clear_cache() -> Result<(), String> {
    log::info!("Clearing application cache");
    // In a real implementation, this would clear WebView cache
    // For Tauri 2.0, this would involve webview-specific APIs
    Ok(())
}

/// Get application version
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Check if this is the first run
#[tauri::command]
pub async fn is_first_run(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(*state.is_first_run.read().await)
}

/// Mark first run as complete
#[tauri::command]
pub async fn complete_first_run(state: State<'_, AppState>) -> Result<(), String> {
    *state.is_first_run.write().await = false;
    Ok(())
}

#[tauri::command]
pub async fn create_figma_window(app: tauri::AppHandle, proxy: String) -> Result<(), String> {
    const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    // Reuse existing window if already open
    if let Some(window) = app.get_webview_window("figma_main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        return Ok(());
    }

    let settings = app.state::<AppState>().advanced_settings.read().await.clone();
    let user_agent = settings
        .custom_user_agent
        .as_deref()
        .unwrap_or(DEFAULT_USER_AGENT);

    // Parse and validate the proxy URL
    let mut proxy_url = Url::parse(&proxy).map_err(|e| format!("Invalid Proxy URL: {}", e))?;

    // Validate scheme and normalize
    match proxy_url.scheme() {
        "http" | "https" | "socks5" => {
            if proxy_url.scheme() == "https" {
                proxy_url
                    .set_scheme("http")
                    .map_err(|_| "Failed to normalize proxy scheme")?;
            }
        }
        _ => return Err(format!("Unsupported proxy scheme: {}", proxy_url.scheme())),
    }

    // Build the window with Figma as the EXTERNAL URL
    let mut builder = WebviewWindowBuilder::new(
        &app,
        "figma_main",
        WebviewUrl::External("https://www.figma.com/".parse().unwrap()),
    )
    .title("Figma - Bypassed")
    .inner_size(1280.0, 800.0)
    .proxy_url(proxy_url)
    .user_agent(user_agent);

    if settings.webrtc_protection {
        builder = builder.initialization_script(WEBRTC_PROTECTION_SCRIPT);
    }

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}
