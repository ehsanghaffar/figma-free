//! Tauri commands for proxy and application control
//! These commands are invoked from the frontend

use tauri::State;
use crate::proxy::{ProxyConfig, ProxyTestResult, ProxyStatus, SharedProxyManager, SharedHealthMonitor, ProxyPreset, ProxyType};
use crate::utils::{AdvancedSettings, store_proxy_password, get_proxy_password, delete_proxy_password};
use crate::AppState;

/// Set proxy configuration
#[tauri::command]
pub async fn set_proxy_config(
    config: ProxyConfig,
    state: State<'_, AppState>,
) -> Result<(), String> {
    log::info!("Setting proxy config: {:?}", config.host);
    
    // Store password securely if provided
    if let (Some(ref password), true) = (&config.password, !config.password.as_ref().map_or(true, |p| p.is_empty())) {
        store_proxy_password(&config.host, config.port, password)
            .map_err(|e| format!("Failed to store password: {}", e))?;
    }
    
    // Configure proxy manager
    state.proxy_manager
        .configure(config)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Test proxy connection
#[tauri::command]
pub async fn test_proxy_connection(
    config: ProxyConfig,
    state: State<'_, AppState>,
) -> Result<ProxyTestResult, String> {
    log::info!("Testing proxy connection to {}:{}", config.host, config.port);
    
    // Get password from keyring if not provided
    let config = if config.username.is_some() && config.password.is_none() {
        let password = get_proxy_password(&config.host, config.port).ok();
        ProxyConfig {
            password,
            ..config
        }
    } else {
        config
    };
    
    let result = state.proxy_manager.test_connection(&config).await;
    Ok(result)
}

/// Get current proxy status
#[tauri::command]
pub async fn get_proxy_status(
    state: State<'_, AppState>,
) -> Result<ProxyStatus, String> {
    Ok(state.proxy_manager.get_status().await)
}

/// Toggle proxy on/off
#[tauri::command]
pub async fn toggle_proxy(
    enabled: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    log::info!("Toggling proxy: {}", enabled);
    state.proxy_manager
        .toggle(enabled)
        .await
        .map_err(|e| e.to_string())
}

/// Get current proxy configuration
#[tauri::command]
pub async fn get_proxy_config(
    state: State<'_, AppState>,
) -> Result<ProxyConfig, String> {
    let mut config = state.proxy_manager.get_config().await;
    // Don't send password to frontend
    config.password = None;
    Ok(config)
}

/// Delete stored proxy credentials
#[tauri::command]
pub async fn delete_proxy_credentials(
    host: String,
    port: u16,
) -> Result<(), String> {
    delete_proxy_password(&host, port)
        .map_err(|e| format!("Failed to delete credentials: {}", e))
}

/// Check URL interception (called from injected JS)
#[tauri::command]
pub async fn should_intercept_url(
    url: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let config = state.interceptor_config.read().await;
    Ok(config.should_intercept(&url))
}

/// Get proxy presets
#[tauri::command]
pub async fn get_proxy_presets() -> Result<Vec<ProxyPreset>, String> {
    // Return some example presets - in production these would come from storage or API
    Ok(vec![
        ProxyPreset {
            name: "Custom Server".to_string(),
            proxy_type: ProxyType::Socks5,
            host: String::new(),
            port: 1080,
            requires_auth: false,
            location: None,
        },
    ])
}

/// Save advanced settings
#[tauri::command]
pub async fn save_advanced_settings(
    settings: AdvancedSettings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    log::info!("Saving advanced settings");
    *state.advanced_settings.write().await = settings;
    Ok(())
}

/// Get advanced settings
#[tauri::command]
pub async fn get_advanced_settings(
    state: State<'_, AppState>,
) -> Result<AdvancedSettings, String> {
    Ok(state.advanced_settings.read().await.clone())
}

/// Trigger manual health check
#[tauri::command]
pub async fn trigger_health_check(
    state: State<'_, AppState>,
) -> Result<bool, String> {
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
pub async fn is_first_run(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    Ok(*state.is_first_run.read().await)
}

/// Mark first run as complete
#[tauri::command]
pub async fn complete_first_run(
    state: State<'_, AppState>,
) -> Result<(), String> {
    *state.is_first_run.write().await = false;
    Ok(())
}
