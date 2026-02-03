//! DNS utilities and custom resolver support

use std::net::{IpAddr, SocketAddr};

/// DNS configuration
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DnsConfig {
    /// Custom DNS servers
    pub servers: Vec<String>,
    /// Use DNS over HTTPS
    pub use_doh: bool,
    /// DoH provider URL
    pub doh_url: Option<String>,
}

impl Default for DnsConfig {
    fn default() -> Self {
        Self {
            servers: vec![
                "1.1.1.1".to_string(), // Cloudflare
                "8.8.8.8".to_string(), // Google
                "9.9.9.9".to_string(), // Quad9
            ],
            use_doh: false,
            doh_url: Some("https://cloudflare-dns.com/dns-query".to_string()),
        }
    }
}

impl DnsConfig {
    /// Parse DNS servers into SocketAddr
    pub fn get_socket_addrs(&self) -> Vec<SocketAddr> {
        self.servers
            .iter()
            .filter_map(|s| s.parse::<IpAddr>().ok().map(|ip| SocketAddr::new(ip, 53)))
            .collect()
    }

    /// Validate DNS configuration
    pub fn validate(&self) -> Result<(), String> {
        if self.servers.is_empty() {
            return Err("At least one DNS server is required".to_string());
        }

        for server in &self.servers {
            if server.parse::<IpAddr>().is_err() {
                return Err(format!("Invalid DNS server address: {}", server));
            }
        }

        if self.use_doh && self.doh_url.is_none() {
            return Err("DoH URL is required when DoH is enabled".to_string());
        }

        Ok(())
    }
}

/// Well-known DNS providers
pub mod providers {
    pub const CLOUDFLARE: &str = "1.1.1.1";
    pub const CLOUDFLARE_SECONDARY: &str = "1.0.0.1";
    pub const GOOGLE: &str = "8.8.8.8";
    pub const GOOGLE_SECONDARY: &str = "8.8.4.4";
    pub const QUAD9: &str = "9.9.9.9";
    pub const OPENDNS: &str = "208.67.222.222";

    pub const CLOUDFLARE_DOH: &str = "https://cloudflare-dns.com/dns-query";
    pub const GOOGLE_DOH: &str = "https://dns.google/dns-query";
    pub const QUAD9_DOH: &str = "https://dns.quad9.net/dns-query";
}
