/**
 * Browser-safe polyfills for Node.js modules
 * 
 * This module provides mock implementations of Node.js built-ins for the browser environment.
 * Import this module at the application entry point to ensure compatibility with code that
 * might reference Node.js APIs.
 */

// Import the client entry point that sets up all polyfills
import './client-entry';

// Export environment detection utilities
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

// Utility function to run code only in browser environments
export function runInBrowser(fn: () => void): void {
  if (isClient) {
    fn();
  }
}

// Utility function to run code only in server environments
export function runInServer(fn: () => void): void {
  if (isServer) {
    fn();
  }
}

// Export default object for easier imports
export default {
  isClient,
  isServer,
  runInBrowser,
  runInServer,
};
