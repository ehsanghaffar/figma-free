//! Figma Desktop Wrapper with Proxy Support
//! A cross-platform desktop application that wraps Figma with built-in proxy capabilities

use std::sync::Mutex;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tokio::sync::RwLock;

pub mod commands;
pub mod network;
pub mod proxy;
pub mod utils;

use network::InterceptorConfig;
use proxy::{
    create_health_monitor, create_proxy_manager, HealthCheckConfig, SharedHealthMonitor,
    SharedProxyManager,
};
use utils::{get_proxy_password, AdvancedSettings};

/// Global application state
pub struct AppState {
    pub proxy_manager: SharedProxyManager,
    pub health_monitor: SharedHealthMonitor,
    pub interceptor_config: RwLock<InterceptorConfig>,
    pub advanced_settings: RwLock<AdvancedSettings>,
    pub is_first_run: RwLock<bool>,
    pub tray_icon: Mutex<Option<TrayIcon>>,
}

impl AppState {
    pub fn new() -> Self {
        let proxy_manager = create_proxy_manager();
        let health_monitor =
            create_health_monitor(proxy_manager.clone(), Some(HealthCheckConfig::default()));

        Self {
            proxy_manager,
            health_monitor,
            interceptor_config: RwLock::new(InterceptorConfig::default()),
            advanced_settings: RwLock::new(AdvancedSettings::default()),
            is_first_run: RwLock::new(true),
            tray_icon: Mutex::new(None),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    log::info!("Starting Figma Desktop v{}", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .manage(AppState::new())
        .setup(|app| {
            let handle = app.handle().clone();

            // Create system tray
            let tray = setup_system_tray(&handle)?;
            if let Ok(mut slot) = app.state::<AppState>().tray_icon.lock() {
                *slot = Some(tray);
            }

            // Get the main window
            if let Some(window) = app.get_webview_window("main") {
                // Set up window event handlers
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::CloseRequested { api, .. } => {
                            // Hide to tray instead of closing
                            let _ = window_clone.hide();
                            api.prevent_close();
                        }
                        _ => {}
                    }
                });
            }

            // Start health monitoring in background
            let state = app.state::<AppState>();
            let health_monitor = state.health_monitor.clone();
            tauri::async_runtime::spawn(async move {
                health_monitor.start().await;
                health_monitor.run_loop().await;
            });

            log::info!("Application setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_proxy_config,
            commands::test_proxy_connection,
            commands::get_proxy_status,
            commands::toggle_proxy,
            commands::get_proxy_config,
            commands::delete_proxy_credentials,
            commands::should_intercept_url,
            commands::get_proxy_presets,
            commands::save_advanced_settings,
            commands::get_advanced_settings,
            commands::trigger_health_check,
            commands::clear_cache,
            commands::get_app_version,
            commands::is_first_run,
            commands::complete_first_run,
            commands::create_figma_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Set up the system tray icon and menu
fn setup_system_tray(handle: &tauri::AppHandle) -> Result<TrayIcon, Box<dyn std::error::Error>> {
    // Create menu items
    let show = MenuItemBuilder::with_id("show", "Show Window").build(handle)?;
    let toggle_proxy = MenuItemBuilder::with_id("toggle_proxy", "Toggle Proxy").build(handle)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings...").build(handle)?;
    let separator = tauri::menu::PredefinedMenuItem::separator(handle)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(handle)?;

    // Build menu
    let menu = MenuBuilder::new(handle)
        .items(&[
            &show,
            &toggle_proxy,
            &separator,
            &settings,
            &separator,
            &quit,
        ])
        .build()?;

    // Create tray icon
    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Figma Desktop")
        .on_menu_event(move |app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
                "toggle_proxy" => {
                    let app_clone = app.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Some(state) = app_clone.try_state::<AppState>() {
                            let is_enabled = state.proxy_manager.is_enabled().await;
                            if !is_enabled {
                                let mut config = state.proxy_manager.get_config().await;
                                if config.username.is_some() && config.password.is_none() {
                                    let password =
                                        get_proxy_password(&config.host, config.port).ok();
                                    config.password = password;
                                }
                                let _ = state.proxy_manager.configure(config).await;
                            } else {
                                let _ = state.proxy_manager.toggle(false).await;
                            }

                            // Emit event to frontend
                            let _ = app_clone.emit("proxy-toggled", !is_enabled);
                        }
                    });
                }
                "settings" => {
                    // Emit event to open settings
                    let _ = app.emit("open-settings", ());
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        })
        .build(handle)?;

    Ok(tray)
}
