# Project Overview

This is a cross-platform desktop application that wraps Figma with built-in proxy capabilities. It is built using Tauri, React, and TypeScript. The application allows users to configure a proxy and then launch Figma with that proxy, which is useful for regions with network restrictions.

## Main Technologies

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Desktop:** Tauri (Rust)
*   **State Management:** Zustand

## Architecture

The application consists of two main parts:

1.  **Frontend:** A React-based single-page application that provides the user interface for configuring the proxy settings. The frontend is built using Vite and styled with Tailwind CSS.
2.  **Backend:** A Tauri application written in Rust that manages the proxy, creates the Figma window, and provides the system tray integration.

The frontend communicates with the backend through Tauri's command system. The application's state is managed using Zustand, with separate stores for the proxy configuration, settings panel, and application-level state.

# Building and Running

## Prerequisites

*   Node.js and pnpm
*   Rust and Cargo

## Development

To run the application in development mode, use the following command:

```bash
pnpm dev
```

This will start the Vite development server for the frontend and the Tauri application in development mode.

## Building

To build the application for production, use the following command:

```bash
pnpm build
```

This will build the frontend and then the Tauri application for your platform. The output will be in the `src-tauri/target/release` directory.

## Testing

There are no explicit test commands defined in the project.

# Development Conventions

*   **Styling:** The project uses Tailwind CSS for styling. Utility classes are preferred over custom CSS.
*   **State Management:** Zustand is used for state management. The state is persisted to local storage.
*   **API:** The frontend communicates with the backend through Tauri commands defined in `src-tauri/src/commands.rs`.
*   **Proxy Management:** The proxy is managed by the `ProxyManager` in `src-tauri/src/proxy/manager.rs`.
*   **System Tray:** The application has a system tray icon that allows the user to show the window, toggle the proxy, open settings, and quit the application.
