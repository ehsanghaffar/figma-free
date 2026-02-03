//! Request interceptor for WebView traffic
//! Handles routing requests through the proxy when enabled

use serde::{Deserialize, Serialize};

/// Request interception configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterceptorConfig {
    /// Enable request interception
    pub enabled: bool,
    /// URLs to intercept (glob patterns)
    pub intercept_patterns: Vec<String>,
    /// URLs to bypass (glob patterns)
    pub bypass_patterns: Vec<String>,
}

impl Default for InterceptorConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            intercept_patterns: vec![
                "https://*.figma.com/*".to_string(),
                "https://www.figma.com/*".to_string(),
            ],
            bypass_patterns: vec![
                "https://fonts.googleapis.com/*".to_string(),
                "https://fonts.gstatic.com/*".to_string(),
            ],
        }
    }
}

impl InterceptorConfig {
    /// Check if a URL should be intercepted
    pub fn should_intercept(&self, url: &str) -> bool {
        if !self.enabled {
            return false;
        }

        // Check bypass patterns first
        for pattern in &self.bypass_patterns {
            if Self::matches_pattern(url, pattern) {
                return false;
            }
        }

        // Check intercept patterns
        for pattern in &self.intercept_patterns {
            if Self::matches_pattern(url, pattern) {
                return true;
            }
        }

        false
    }

    /// Simple glob pattern matching
    fn matches_pattern(url: &str, pattern: &str) -> bool {
        let pattern = pattern.replace('.', r"\.");
        let pattern = pattern.replace('*', ".*");
        let regex = match regex::Regex::new(&format!("^{}$", pattern)) {
            Ok(r) => r,
            Err(_) => return false,
        };
        regex.is_match(url)
    }
}

/// JavaScript code to inject into WebView for request interception
pub const INTERCEPTOR_SCRIPT: &str = r#"
(function() {
    'use strict';
    
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Store original XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    
    // Check if we should route through proxy
    async function shouldProxy(url) {
        try {
            const result = await window.__TAURI__.invoke('should_intercept_url', { url });
            return result;
        } catch (e) {
            console.warn('Failed to check proxy routing:', e);
            return false;
        }
    }
    
    // Override fetch
    window.fetch = async function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        
        // For now, use original fetch - proxy is handled at the system level
        return originalFetch.call(this, input, init);
    };
    
    // Disable WebRTC to prevent IP leaks (if enabled in settings)
    if (window.__FIGMA_DESKTOP_WEBRTC_PROTECTION__) {
        Object.defineProperty(window, 'RTCPeerConnection', {
            value: undefined,
            writable: false
        });
        Object.defineProperty(window, 'webkitRTCPeerConnection', {
            value: undefined,
            writable: false
        });
        Object.defineProperty(window, 'mozRTCPeerConnection', {
            value: undefined,
            writable: false
        });
    }
    
    console.log('[Figma Desktop] Network interceptor initialized');
})();
"#;

/// JavaScript code for WebRTC leak protection
pub const WEBRTC_PROTECTION_SCRIPT: &str = r#"
(function() {
    'use strict';
    
    // Disable WebRTC completely
    const noop = function() {};
    
    window.RTCPeerConnection = function() {
        throw new Error('WebRTC is disabled for privacy protection');
    };
    window.RTCPeerConnection.prototype = {};
    
    if (window.webkitRTCPeerConnection) {
        window.webkitRTCPeerConnection = window.RTCPeerConnection;
    }
    if (window.mozRTCPeerConnection) {
        window.mozRTCPeerConnection = window.RTCPeerConnection;
    }
    
    // Also disable related APIs
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = function() {
            return Promise.reject(new Error('Media devices disabled'));
        };
    }
    
    console.log('[Figma Desktop] WebRTC protection enabled');
})();
"#;
