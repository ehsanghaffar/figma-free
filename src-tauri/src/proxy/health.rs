//! Health check module for proxy connections
//! Monitors connection status and performs periodic health checks

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tokio::time::interval;

use crate::proxy::config::ProxyTestResult;
use crate::proxy::manager::SharedProxyManager;

/// Health check configuration
#[derive(Debug, Clone)]
pub struct HealthCheckConfig {
    /// Interval between health checks in seconds
    pub interval_secs: u64,
    /// Timeout for health check requests
    pub timeout_secs: u64,
    /// Number of consecutive failures before marking as disconnected
    pub failure_threshold: u32,
    /// URL to use for health checks
    pub check_url: String,
}

impl Default for HealthCheckConfig {
    fn default() -> Self {
        Self {
            interval_secs: 30,
            timeout_secs: 10,
            failure_threshold: 3,
            check_url: "https://www.google.com".to_string(),
        }
    }
}

/// Health monitor for proxy connections
pub struct HealthMonitor {
    proxy_manager: SharedProxyManager,
    config: HealthCheckConfig,
    is_running: RwLock<bool>,
    consecutive_failures: RwLock<u32>,
}

impl HealthMonitor {
    pub fn new(proxy_manager: SharedProxyManager, config: HealthCheckConfig) -> Self {
        Self {
            proxy_manager,
            config,
            is_running: RwLock::new(false),
            consecutive_failures: RwLock::new(0),
        }
    }

    /// Start the health monitoring loop
    pub async fn start(&self) {
        let mut running = self.is_running.write().await;
        if *running {
            return;
        }
        *running = true;
        drop(running);

        log::info!(
            "Starting health monitor with {}s interval",
            self.config.interval_secs
        );
    }

    /// Stop the health monitoring
    pub async fn stop(&self) {
        let mut running = self.is_running.write().await;
        *running = false;
        log::info!("Health monitor stopped");
    }

    /// Perform a single health check
    pub async fn check_health(&self) -> bool {
        let proxy_manager = &self.proxy_manager;

        // Skip if proxy is not enabled
        if !proxy_manager.is_enabled().await {
            return true; // Direct connection assumed healthy
        }

        let config = proxy_manager.get_config().await;

        // Build a ProxyTestResult by performing a GET to the configured check_url
        let result: ProxyTestResult = {
            // Validate config first
            if let Err(e) = config.validate() {
                ProxyTestResult::failure(e)
            } else {
                let start = Instant::now();
                let response_result = proxy_manager.request(&self.config.check_url).await;

                match response_result {
                    Ok(response) => {
                        let latency = start.elapsed().as_millis() as u64;
                        if response.status().is_success() {
                            ProxyTestResult::success(latency, None)
                        } else {
                            ProxyTestResult::failure(format!("HTTP error: {}", response.status()))
                        }
                    }
                    Err(e) => ProxyTestResult::failure(format!("Connection error: {}", e)),
                }
            }
        };

        if result.success {
            *self.consecutive_failures.write().await = 0;
            proxy_manager
                .update_status(true, result.latency_ms, None)
                .await;
            log::debug!("Health check passed, latency: {:?}ms", result.latency_ms);
            true
        } else {
            let mut failures = self.consecutive_failures.write().await;
            *failures += 1;

            let error = result.error.clone();
            let is_disconnected = *failures >= self.config.failure_threshold;

            proxy_manager
                .update_status(!is_disconnected, None, error.clone())
                .await;

            if is_disconnected {
                log::warn!(
                    "Health check failed {} times, marking as disconnected",
                    *failures
                );
            } else {
                log::debug!("Health check failed ({}): {:?}", *failures, error);
            }

            !is_disconnected
        }
    }

    /// Run the health check loop (call this in a spawned task)
    pub async fn run_loop(self: Arc<Self>) {
        let mut interval = interval(Duration::from_secs(self.config.interval_secs));

        loop {
            interval.tick().await;

            if !*self.is_running.read().await {
                break;
            }

            self.check_health().await;
        }
    }

    /// Get number of consecutive failures
    pub async fn get_failure_count(&self) -> u32 {
        *self.consecutive_failures.read().await
    }

    /// Reset failure counter
    pub async fn reset_failures(&self) {
        *self.consecutive_failures.write().await = 0;
    }
}

pub type SharedHealthMonitor = Arc<HealthMonitor>;

pub fn create_health_monitor(
    proxy_manager: SharedProxyManager,
    config: Option<HealthCheckConfig>,
) -> SharedHealthMonitor {
    Arc::new(HealthMonitor::new(
        proxy_manager,
        config.unwrap_or_default(),
    ))
}
