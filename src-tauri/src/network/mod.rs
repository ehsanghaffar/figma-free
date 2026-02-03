//! Network module
//! Handles DNS configuration and request interception

pub mod dns;
pub mod interceptor;

pub use dns::*;
pub use interceptor::*;
