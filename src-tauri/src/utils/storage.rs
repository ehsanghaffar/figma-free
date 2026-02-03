//! Storage utilities for persisting application settings
//! Uses Tauri's store plugin for secure local storage

use serde::{de::DeserializeOwned, Serialize};
use std::path::PathBuf;

/// Application settings keys
pub mod keys {
    pub const PROXY_CONFIG: &str = "proxy_config";
    pub const ADVANCED_SETTINGS: &str = "advanced_settings";
    pub const WINDOW_STATE: &str = "window_state";
    pub const PROXY_PRESETS: &str = "proxy_presets";
    pub const FIRST_RUN: &str = "first_run";
}

/// Advanced settings structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvancedSettings {
    /// Custom DNS servers (comma-separated)
    pub custom_dns: Option<String>,
    /// Enable WebRTC leak protection
    pub webrtc_protection: bool,
    /// Custom user agent string
    pub custom_user_agent: Option<String>,
    /// Enable kill switch (block traffic if proxy disconnects)
    pub kill_switch: bool,
    /// Auto-update enabled
    pub auto_update: bool,
}

impl Default for AdvancedSettings {
    fn default() -> Self {
        Self {
            custom_dns: None,
            webrtc_protection: true,
            custom_user_agent: None,
            kill_switch: false,
            auto_update: true,
        }
    }
}

/// Window state for restoration
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub maximized: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        Self {
            width: 1400,
            height: 900,
            x: None,
            y: None,
            maximized: false,
        }
    }
}

/// Get the app data directory
pub fn get_app_data_dir() -> Option<PathBuf> {
    dirs::data_dir().map(|p| p.join("figma-desktop"))
}

/// Get the config file path
pub fn get_config_path() -> Option<PathBuf> {
    get_app_data_dir().map(|p| p.join("config.json"))
}

/// Get the logs directory
pub fn get_logs_dir() -> Option<PathBuf> {
    get_app_data_dir().map(|p| p.join("logs"))
}
