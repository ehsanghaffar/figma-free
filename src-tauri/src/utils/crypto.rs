//! Secure credential storage using OS keyring
//! Encrypts and stores proxy credentials securely

use keyring::Entry;

const SERVICE_NAME: &str = "figma-desktop-proxy";

/// Error types for credential operations
#[derive(Debug, thiserror::Error)]
pub enum CredentialError {
    #[error("Keyring error: {0}")]
    KeyringError(String),
    #[error("Credential not found")]
    NotFound,
    #[error("Invalid credential format")]
    InvalidFormat,
}

impl From<keyring::Error> for CredentialError {
    fn from(err: keyring::Error) -> Self {
        match err {
            keyring::Error::NoEntry => CredentialError::NotFound,
            e => CredentialError::KeyringError(e.to_string()),
        }
    }
}

/// Store a credential securely in the OS keyring
pub fn store_credential(key: &str, value: &str) -> Result<(), CredentialError> {
    let entry = Entry::new(SERVICE_NAME, key)?;
    entry.set_password(value)?;
    log::debug!("Stored credential for key: {}", key);
    Ok(())
}

/// Retrieve a credential from the OS keyring
pub fn get_credential(key: &str) -> Result<String, CredentialError> {
    let entry = Entry::new(SERVICE_NAME, key)?;
    let password = entry.get_password()?;
    log::debug!("Retrieved credential for key: {}", key);
    Ok(password)
}

/// Delete a credential from the OS keyring
pub fn delete_credential(key: &str) -> Result<(), CredentialError> {
    let entry = Entry::new(SERVICE_NAME, key)?;
    match entry.delete_credential() {
        Ok(_) => {
            log::debug!("Deleted credential for key: {}", key);
            Ok(())
        }
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(CredentialError::from(e)),
    }
}

/// Store proxy password securely
pub fn store_proxy_password(host: &str, port: u16, password: &str) -> Result<(), CredentialError> {
    let key = format!("proxy_{}_{}", host, port);
    store_credential(&key, password)
}

/// Retrieve proxy password
pub fn get_proxy_password(host: &str, port: u16) -> Result<String, CredentialError> {
    let key = format!("proxy_{}_{}", host, port);
    get_credential(&key)
}

/// Delete proxy password
pub fn delete_proxy_password(host: &str, port: u16) -> Result<(), CredentialError> {
    let key = format!("proxy_{}_{}", host, port);
    delete_credential(&key)
}

/// Check if a credential exists
pub fn credential_exists(key: &str) -> bool {
    let entry = match Entry::new(SERVICE_NAME, key) {
        Ok(e) => e,
        Err(_) => return false,
    };
    entry.get_password().is_ok()
}
