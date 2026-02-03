//! Proxy configuration module
//! Handles proxy settings, serialization, and validation

use serde::{Deserialize, Serialize};

/// Proxy protocol type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ProxyType {
    #[default]
    Socks5,
    Http,
    Https,
}

impl std::fmt::Display for ProxyType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProxyType::Socks5 => write!(f, "socks5"),
            ProxyType::Http => write!(f, "http"),
            ProxyType::Https => write!(f, "https"),
        }
    }
}

/// Proxy configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyConfig {
    /// Whether proxy is enabled
    pub enabled: bool,
    /// Type of proxy protocol
    #[serde(rename = "type")]
    pub proxy_type: ProxyType,
    /// Proxy server hostname
    pub host: String,
    /// Proxy server port
    pub port: u16,
    /// Optional username for authentication
    pub username: Option<String>,
    /// Optional password for authentication (not stored, retrieved from keyring)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    /// Auto-detect proxy settings from system
    pub auto_detect: bool,
    /// Auto-connect on startup
    pub auto_connect: bool,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            proxy_type: ProxyType::Socks5,
            host: String::new(),
            port: 1080,
            username: None,
            password: None,
            auto_detect: false,
            auto_connect: false,
        }
    }
}

impl ProxyConfig {
    /// Create a new proxy configuration
    pub fn new(proxy_type: ProxyType, host: String, port: u16) -> Self {
        Self {
            enabled: true,
            proxy_type,
            host,
            port,
            username: None,
            password: None,
            auto_detect: false,
            auto_connect: false,
        }
    }

    /// Set authentication credentials
    pub fn with_auth(mut self, username: String, password: String) -> Self {
        self.username = Some(username);
        self.password = Some(password);
        self
    }

    /// Validate the proxy configuration
    pub fn validate(&self) -> Result<(), String> {
        if self.host.is_empty() {
            return Err("Proxy host cannot be empty".to_string());
        }
        if self.port == 0 {
            return Err("Proxy port must be greater than 0".to_string());
        }
        if self.port > 65535 {
            return Err("Proxy port must be less than 65536".to_string());
        }
        // Basic hostname validation
        if self.host.contains(' ') {
            return Err("Proxy host cannot contain spaces".to_string());
        }
        Ok(())
    }

    /// Build the proxy URL
    pub fn to_url(&self) -> String {
        let auth = match (&self.username, &self.password) {
            (Some(user), Some(pass)) => format!("{}:{}@", user, pass),
            (Some(user), None) => format!("{}@", user),
            _ => String::new(),
        };
        format!("{}://{}{}:{}", self.proxy_type, auth, self.host, self.port)
    }
}

/// Result of a proxy connection test
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyTestResult {
    /// Whether the connection was successful
    pub success: bool,
    /// Connection latency in milliseconds
    pub latency_ms: Option<u64>,
    /// Error message if connection failed
    pub error: Option<String>,
    /// IP address as seen by the target server
    pub external_ip: Option<String>,
}

impl ProxyTestResult {
    pub fn success(latency_ms: u64, external_ip: Option<String>) -> Self {
        Self {
            success: true,
            latency_ms: Some(latency_ms),
            error: None,
            external_ip,
        }
    }

    pub fn failure(error: String) -> Self {
        Self {
            success: false,
            latency_ms: None,
            error: Some(error),
            external_ip: None,
        }
    }
}

/// Current proxy status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyStatus {
    /// Whether proxy is currently active
    pub is_connected: bool,
    /// Current configuration (without password)
    pub config: Option<ProxyConfig>,
    /// Last measured latency in milliseconds
    pub latency_ms: Option<u64>,
    /// Last error message
    pub last_error: Option<String>,
    /// Timestamp of last status update
    pub last_updated: String,
}

impl Default for ProxyStatus {
    fn default() -> Self {
        Self {
            is_connected: false,
            config: None,
            latency_ms: None,
            last_error: None,
            last_updated: chrono::Utc::now().to_rfc3339(),
        }
    }
}

/// Preset proxy server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyPreset {
    /// Display name
    pub name: String,
    /// Proxy type
    pub proxy_type: ProxyType,
    /// Host
    pub host: String,
    /// Port
    pub port: u16,
    /// Whether authentication is required
    pub requires_auth: bool,
    /// Geographic location
    pub location: Option<String>,
}

impl ProxyPreset {
    pub fn to_config(&self) -> ProxyConfig {
        ProxyConfig {
            enabled: true,
            proxy_type: self.proxy_type,
            host: self.host.clone(),
            port: self.port,
            username: None,
            password: None,
            auto_detect: false,
            auto_connect: false,
        }
    }
}
