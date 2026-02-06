//! Proxy manager module
//! Handles proxy client creation, connection management, and request routing

use crate::proxy::config::{ProxyConfig, ProxyStatus, ProxyTestResult, ProxyType};
use reqwest::{Client, Proxy};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Custom error type for proxy operations
#[derive(Debug, thiserror::Error)]
pub enum ProxyError {
    #[error("Proxy configuration error: {0}")]
    ConfigError(String),
    #[error("Proxy connection error: {0}")]
    ConnectionError(String),
    #[error("Request error: {0}")]
    RequestError(#[from] reqwest::Error),
    #[error("Invalid proxy URL: {0}")]
    InvalidUrl(String),
    #[error("Proxy not configured")]
    NotConfigured,
    #[error("Proxy disabled")]
    Disabled,
}

/// Proxy manager handles all proxy-related operations
pub struct ProxyManager {
    /// HTTP client with proxy configuration
    client: RwLock<Option<Client>>,
    /// Direct HTTP client (no proxy)
    direct_client: Client,
    /// Current proxy configuration
    config: RwLock<ProxyConfig>,
    /// Current connection status
    status: RwLock<ProxyStatus>,
}

impl ProxyManager {
    /// Create a new proxy manager
    pub fn new() -> Self {
        let direct_client = Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client: RwLock::new(None),
            direct_client,
            config: RwLock::new(ProxyConfig::default()),
            status: RwLock::new(ProxyStatus::default()),
        }
    }

    /// Configure the proxy with the given settings
    pub async fn configure(&self, config: ProxyConfig) -> Result<(), ProxyError> {
        if config.enabled {
            // Validate configuration
            config.validate().map_err(ProxyError::ConfigError)?;

            // Build the proxy URL
            let proxy_url = config.to_url();

            // Create proxy based on type
            let proxy = match config.proxy_type {
                ProxyType::Socks5 => Proxy::all(&proxy_url),
                ProxyType::Http | ProxyType::Https => Proxy::all(&proxy_url),
            }
            .map_err(|e| ProxyError::InvalidUrl(e.to_string()))?;

            // Build new client with proxy
            let client = Client::builder()
                .proxy(proxy)
                .timeout(Duration::from_secs(30))
                .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .danger_accept_invalid_certs(false)
                .build()
                .map_err(|e| ProxyError::ConnectionError(e.to_string()))?;

            // Update state
            *self.client.write().await = Some(client);
        } else {
            *self.client.write().await = None;
        }

        *self.config.write().await = config.clone();

        // Update status
        let mut status = self.status.write().await;
        status.config = Some(ProxyConfig {
            password: None, // Don't store password in status
            ..config
        });
        status.last_updated = chrono::Utc::now().to_rfc3339();
        if !status.config.as_ref().map(|c| c.enabled).unwrap_or(false) {
            status.is_connected = false;
            status.latency_ms = None;
            status.last_error = None;
        }

        Ok(())
    }

    /// Test the proxy connection
    pub async fn test_connection(&self, config: &ProxyConfig) -> ProxyTestResult {
        if !config.enabled {
            return ProxyTestResult::failure("Proxy is disabled".to_string());
        }

        // Validate config
        if let Err(e) = config.validate() {
            return ProxyTestResult::failure(e);
        }

        // Build test client
        let proxy_url = config.to_url();
        let proxy = match config.proxy_type {
            ProxyType::Socks5 => Proxy::all(&proxy_url),
            ProxyType::Http | ProxyType::Https => Proxy::all(&proxy_url),
        };

        let proxy = match proxy {
            Ok(p) => p,
            Err(e) => return ProxyTestResult::failure(format!("Invalid proxy URL: {}", e)),
        };

        let client = match Client::builder()
            .proxy(proxy)
            .timeout(Duration::from_secs(10))
            .build()
        {
            Ok(c) => c,
            Err(e) => return ProxyTestResult::failure(format!("Failed to create client: {}", e)),
        };

        // Measure connection time
        let start = Instant::now();

        // Test connection by fetching a simple IP check service
        match client.get("https://api.ipify.org?format=json").send().await {
            Ok(response) => {
                let latency = start.elapsed().as_millis() as u64;

                if response.status().is_success() {
                    // Try to get the external IP
                    let external_ip = response
                        .json::<serde_json::Value>()
                        .await
                        .ok()
                        .and_then(|v| v.get("ip").and_then(|ip| ip.as_str().map(String::from)));

                    ProxyTestResult::success(latency, external_ip)
                } else {
                    ProxyTestResult::failure(format!("HTTP error: {}", response.status()))
                }
            }
            Err(e) => {
                if e.is_timeout() {
                    ProxyTestResult::failure("Connection timed out".to_string())
                } else if e.is_connect() {
                    ProxyTestResult::failure("Failed to connect to proxy server".to_string())
                } else {
                    ProxyTestResult::failure(format!("Connection error: {}", e))
                }
            }
        }
    }

    /// Get current proxy status
    pub async fn get_status(&self) -> ProxyStatus {
        self.status.read().await.clone()
    }

    /// Enable or disable the proxy
    pub async fn toggle(&self, enabled: bool) -> Result<(), ProxyError> {
        let mut config = self.config.write().await;
        config.enabled = enabled;

        if !enabled {
            // Clear the proxy client
            *self.client.write().await = None;
            let mut status = self.status.write().await;
            status.is_connected = false;
            status.latency_ms = None;
            status.last_updated = chrono::Utc::now().to_rfc3339();
        }

        Ok(())
    }

    /// Update connection status after health check
    pub async fn update_status(
        &self,
        is_connected: bool,
        latency_ms: Option<u64>,
        error: Option<String>,
    ) {
        let mut status = self.status.write().await;
        status.is_connected = is_connected;
        status.latency_ms = latency_ms;
        status.last_error = error;
        status.last_updated = chrono::Utc::now().to_rfc3339();
    }

    /// Get the current configuration
    pub async fn get_config(&self) -> ProxyConfig {
        self.config.read().await.clone()
    }

    /// Make a request through the proxy (if enabled) or directly
    pub async fn request(&self, url: &str) -> Result<reqwest::Response, ProxyError> {
        let config = self.config.read().await;

        if config.enabled {
            let client = self.client.read().await;
            if let Some(ref client) = *client {
                client.get(url).send().await.map_err(ProxyError::from)
            } else {
                Err(ProxyError::NotConfigured)
            }
        } else {
            self.direct_client
                .get(url)
                .send()
                .await
                .map_err(ProxyError::from)
        }
    }

    /// Make a GET request with a single header through the proxy (or directly when proxy disabled).
    /// `header_name` and `header_value` are simple string values and will be added to the request.
    pub async fn request_with_header(
        &self,
        url: &str,
        header_name: &str,
        header_value: &str,
    ) -> Result<reqwest::Response, ProxyError> {
        let config = self.config.read().await;

        if config.enabled {
            let client = self.client.read().await;
            if let Some(ref client) = *client {
                client
                    .get(url)
                    .header(header_name, header_value)
                    .send()
                    .await
                    .map_err(ProxyError::from)
            } else {
                Err(ProxyError::NotConfigured)
            }
        } else {
            self.direct_client
                .get(url)
                .header(header_name, header_value)
                .send()
                .await
                .map_err(ProxyError::from)
        }
    }

    /// Check if proxy is currently enabled
    pub async fn is_enabled(&self) -> bool {
        self.config.read().await.enabled
    }
}

impl Default for ProxyManager {
    fn default() -> Self {
        Self::new()
    }
}

// Thread-safe wrapper for use with Tauri state
pub type SharedProxyManager = Arc<ProxyManager>;

pub fn create_proxy_manager() -> SharedProxyManager {
    Arc::new(ProxyManager::new())
}
