# Potential Bugs and Issues

This document lists potential bugs and issues found in the codebase.

1.  **Hardcoded proxy presets:** The `get_proxy_presets` command in `src-tauri/src/commands.rs` returns a hardcoded list of presets. This should be replaced with a mechanism to load presets from a file or a remote server.

2.  **Vague error message in `create_figma_window`:** The error message "Invalid Proxy URL" in the `create_figma_window` command is not very descriptive. It would be better to include the actual error from `Url::parse`.

3.  **Limited window event handling:** The `on_window_event` for the main window in `src-tauri/src/lib.rs` only handles the `CloseRequested` event. It might be beneficial to handle other events as well, such as `FocusLost` or `FocusGained`, to improve the user experience.

4.  **Complex connection status logic:** The logic for determining the connection status in the `useConnectionStatus` hook in `src/hooks/useProxy.ts` is a bit complex and could be simplified.

5.  **Lack of loading indicators for some async operations:** Some asynchronous operations, such as saving advanced settings, don't have loading indicators, which might make the UI feel unresponsive.

6.  **Potential for race conditions:** The application uses several asynchronous operations, and there's a potential for race conditions if they are not handled carefully. For example, if the user clicks the "Save and Enable" button multiple times in quick succession, it might lead to unexpected behavior.

7.  **No input validation on the frontend:** The frontend doesn't seem to have any input validation for the proxy settings. This could lead to errors if the user enters invalid data.

8.  **Cleartext storage of password:** The `store_proxy_password` and `get_proxy_password` functions in `src-tauri/src/utils/mod.rs` appear to be storing the password in cleartext. This is a security risk. The password should be stored in an encrypted format.
