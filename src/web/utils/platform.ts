/**
 * Platform Detection Utilities for Web Build
 * Provides consistent platform checks for web-only builds
 */

/**
 * Check if running in web browser (always true for web build)
 */
export function isWebBuild(): boolean {
  return true;
}

/**
 * Check if running in Electron (always false for web build)
 */
export function isElectron(): boolean {
  return false;
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return navigator.userAgent.includes('Windows');
}

/**
 * Check if running on macOS
 */
export function isMac(): boolean {
  return navigator.userAgent.includes('Mac');
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return navigator.userAgent.includes('Linux');
}

/**
 * Get the platform identifier
 */
export function getPlatform(): 'web' {
  return 'web';
}

/**
 * Check if auto-launch feature is available (not available in web)
 */
export function hasAutoLaunch(): boolean {
  return false;
}

/**
 * Check if app update feature is available (not available in web)
 */
export function hasAppUpdate(): boolean {
  return false;
}

/**
 * Check if file system operations are available (not available in web)
 */
export function hasFileSystem(): boolean {
  return false;
}

/**
 * Check if export logs feature is available (not available in web)
 */
export function hasExportLogs(): boolean {
  return false;
}
