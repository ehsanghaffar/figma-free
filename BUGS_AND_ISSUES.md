# Bugs and Issues Report

## Critical Issues

### 1. Missing Dependency Array in useEffect Hooks
**Location:** `src/hooks/useProxy.ts`
**Lines:** 18, 27, 99, 109, 137, 147
**Severity:** High
**Description:** Multiple useEffect hooks are missing dependencies in their dependency arrays, which can cause stale closures and unexpected behavior.

```typescript
// Line 18 - Missing store dependencies
useEffect(() => {
  store.loadConfig();
  store.refreshStatus();
  // ...
}, []); // Should include store methods

// Line 27 - Missing store dependency
useEffect(() => {
  const unlisten = listen<boolean>('proxy-toggled', (event) => {
    store.setConfig({ enabled: event.payload });
    store.refreshStatus();
  });
  // ...
}, []); // Should include store
```

**Impact:** Can lead to stale state references and race conditions.

### 2. Unsafe Type Assertion in DNSConfigSection
**Location:** `src/components/DNSConfigSection.tsx`
**Line:** 19
**Severity:** Medium
**Description:** Type checking logic is flawed - checking `.length` on a potentially null/undefined value.

```typescript
enabled: advancedSettings.customDns?.length ? true : false,
```

**Impact:** Could cause runtime errors if customDns is null/undefined.

### 3. Memory Leak in Event Listeners
**Location:** `src/hooks/useProxy.ts`
**Lines:** 27-35, 137-145
**Severity:** High
**Description:** Event listeners are set up but cleanup may not execute properly due to missing dependencies.

```typescript
useEffect(() => {
  const unlisten = listen<boolean>('proxy-toggled', (event) => {
    store.setConfig({ enabled: event.payload });
    store.refreshStatus();
  });
  
  return () => {
    unlisten.then((fn) => fn());
  };
}, []); // Missing store dependency
```

**Impact:** Memory leaks and potential duplicate event handlers.

### 4. Race Condition in ProxyConfigSection
**Location:** `src/components/ProxyConfigSection.tsx`
**Lines:** 56-88
**Severity:** High
**Description:** Multiple async operations without proper error handling or state synchronization.

```typescript
const handleSave = async () => {
  // Multiple awaits without proper error boundaries
  const result = await testConnection();
  if (result.success) {
    await saveConfig();
    await toggleProxy(true);
    // ...
    await invoke("trigger_health_check"); // No error handling
    await refreshStatus();
  }
};
```

**Impact:** Can leave application in inconsistent state if any operation fails.

## High Priority Issues

### 5. Inconsistent Error Handling
**Location:** `src/store/proxyStore.ts`
**Lines:** 70-80, 85-95
**Severity:** Medium
**Description:** Error handling is inconsistent - some functions throw, others set error state.

```typescript
saveConfig: async () => {
  try {
    await invoke('set_proxy_config', { config });
    await get().refreshStatus();
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    set({ error });
    throw err; // Throws after setting error state
  }
}
```

**Impact:** Unpredictable error propagation behavior.

### 6. Password Security Issue
**Location:** `src/components/ProxyConfigSection.tsx`
**Lines:** 48-51
**Severity:** High
**Description:** Password normalization removes empty passwords but doesn't handle whitespace-only passwords.

```typescript
const normalizeConfig = (input: ProxyConfig): ProxyConfig => ({
  ...input,
  username: input.username?.trim() ? input.username.trim() : undefined,
  password: input.password?.trim() ? input.password : undefined, // Should trim password too
});
```

**Impact:** Whitespace-only passwords could be stored.

### 7. Unsafe Proxy URL Parsing
**Location:** `src-tauri/src/commands.rs`
**Lines:** 207-211
**Severity:** High
**Description:** Proxy URL parsing doesn't validate the scheme properly before modification.

```rust
let mut proxy_url = Url::parse(&proxy).map_err(|_| "Invalid Proxy URL")?;
if proxy_url.scheme() == "https" {
    proxy_url.set_scheme("http").map_err(|_| "Invalid proxy scheme")?;
}
```

**Impact:** Could allow invalid proxy configurations to pass through.

### 8. Missing Null Checks in HomeScreen
**Location:** `src/components/HomeScreen.tsx`
**Lines:** 23-25
**Severity:** Medium
**Description:** DNSStatus type is confusing and the check doesn't properly validate string length.

```typescript
const isLaunchEnabled = () => {
  return (config.enabled && status === "connected") || 
         (DNSStatus && typeof DNSStatus === "string" && DNSStatus.length > 0);
};
```

**Impact:** Could enable launch button in invalid states.

## Medium Priority Issues

### 9. Unused Import
**Location:** `src/hooks/useProxy.ts`
**Line:** 3
**Severity:** Low
**Description:** `ConnectionStatus` and `ConnectionInfo` types are imported but `ConnectionStatus` is not used in the file scope.

### 10. Inconsistent State Management
**Location:** `src/store/proxyStore.ts`
**Lines:** 37-60
**Severity:** Medium
**Description:** ProxyStore uses both Zustand persist and manual state management, which could lead to sync issues.

```typescript
export const useProxyStore = create<ProxyStore>()(
  persist(
    (set, get) => ({
      // State is persisted to localStorage
      // But also managed by backend via invoke calls
    }),
    {
      name: 'figma-proxy-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**Impact:** State could become out of sync between frontend and backend.

### 11. Hardcoded User Agent
**Location:** `src-tauri/src/commands.rs`
**Line:** 223
**Severity:** Low
**Description:** User agent is hardcoded instead of using the advanced settings.

```rust
.user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...")
```

**Impact:** Custom user agent setting is ignored for Figma window.

### 12. Missing Validation in DNSConfigSection
**Location:** `src/components/DNSConfigSection.tsx`
**Lines:** 36-43
**Severity:** Medium
**Description:** No validation for DNS server format before saving.

```typescript
const handleSave = async () => {
  const updatedSettings = {
    ...advancedSettings,
    customDns: localConfig.enabled ? localConfig.dnsServers : null,
    // No validation of DNS format
  };
  setAdvancedSettings(updatedSettings);
  await saveAdvancedSettings();
};
```

**Impact:** Invalid DNS configurations could be saved.

### 13. Disabled Custom Headers Input
**Location:** `src/components/DNSConfigSection.tsx`
**Line:** 103
**Severity:** Medium
**Description:** Custom headers textarea is always disabled, making the feature unusable.

```typescript
<Textarea
  id="custom-headers"
  value={localConfig.customHeaders}
  onChange={(e) => handleChange('customHeaders', e.target.value)}
  disabled={true} // Always disabled!
  className="font-mono text-sm"
/>
```

**Impact:** Feature is non-functional.

## Low Priority Issues

### 14. Console.log in Production Code
**Location:** `src/components/HomeScreen.tsx`
**Line:** 19
**Severity:** Low
**Description:** Debug console.log statement left in production code.

```typescript
console.log("Connection status:", DNSStatus);
```

**Impact:** Unnecessary logging in production.

### 15. Incomplete Error Messages
**Location:** `src/components/HomeScreen.tsx`
**Line:** 34
**Severity:** Low
**Description:** Generic error message using alert instead of proper toast notification.

```typescript
alert("Failed to launch: " + err);
```

**Impact:** Poor user experience.

### 16. Type Safety Issue in Toaster
**Location:** `src/App.tsx`
**Line:** 31
**Severity:** Low
**Description:** Toaster offset prop uses incorrect type format.

```typescript
<Toaster offset={{ bottom: '24px', right: "16px", left: "16px" }} />
```

**Impact:** May not work as expected - should likely be a string or number.

### 17. Unused Cargo Features
**Location:** `src-tauri/Cargo.toml`
**Lines:** 56-59
**Severity:** Low
**Description:** Unstable Cargo features that may not be necessary.

```toml
[unstable]
unstable-options = true
build-std = ["core", "alloc"]
```

**Impact:** Could cause build issues on some systems.

### 18. Missing Error Handling in Health Check
**Location:** `src/components/ProxyConfigSection.tsx`
**Lines:** 75-78
**Severity:** Low
**Description:** Health check trigger errors are silently ignored.

```typescript
try {
  await invoke("trigger_health_check");
} catch (e) {
  // ignore failures - should at least log
}
```

**Impact:** Silent failures make debugging difficult.

## Code Quality Issues

### 19. Duplicate Default Values
**Location:** Multiple files
**Severity:** Low
**Description:** Default values for ProxyConfig and AdvancedSettings are defined in multiple places (TypeScript types, Rust structs, and store defaults).

**Files:**
- `src/types/proxy.ts`
- `src/store/proxyStore.ts`
- `src-tauri/src/proxy/config.rs`
- `src-tauri/src/utils/storage.rs`

**Impact:** Maintenance burden and potential inconsistencies.

### 20. Missing TypeScript Strict Checks
**Location:** `src/hooks/useProxy.ts`
**Lines:** 40-44
**Severity:** Low
**Description:** Callback dependencies reference entire store object instead of specific methods.

```typescript
const saveAndEnable = useCallback(async () => {
  await store.saveConfig();
  if (!store.config.enabled) {
    await store.toggleProxy(true);
  }
}, [store]); // Should destructure specific methods
```

**Impact:** Unnecessary re-renders.

## Recommendations

1. **Add ESLint rules** for exhaustive-deps in useEffect hooks
2. **Implement proper error boundaries** in React components
3. **Add input validation** for all user inputs (DNS, proxy settings)
4. **Remove console.log** statements from production code
5. **Standardize error handling** across the application
6. **Add unit tests** for critical functions
7. **Enable custom headers** feature or remove the UI
8. **Use proper toast notifications** instead of alert()
9. **Add TypeScript strict mode** checks
10. **Implement proper state synchronization** between frontend and backend

## Security Concerns

1. Password handling should be reviewed for security best practices
2. Proxy credentials should never be logged
3. Custom DNS validation needed to prevent injection attacks
4. User agent customization should be sanitized

---

**Generated:** $(date)
**Total Issues Found:** 20
**Critical:** 4 | **High:** 4 | **Medium:** 6 | **Low:** 6
