/**
 * Environment utility functions
 * Helps with determining execution context and handling environment-specific code
 */

// Check if code is running on the client side (browser)
export const isClient = typeof window !== 'undefined';

// Check if code is running on the server side
export const isServer = !isClient;

// Check if we're in development mode
export const isDevelopment = process.env.NODE_ENV === 'development';

// Check if we're in production mode
export const isProduction = process.env.NODE_ENV === 'production';

// Check if we're in test mode
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Safely runs code only on the client side
 * @param callback Function to run on client side
 */
export const runOnClient = (callback: () => void): void => {
  if (isClient) {
    callback();
  }
};

/**
 * Safely runs code only on the server side
 * @param callback Function to run on server side
 */
export const runOnServer = (callback: () => void): void => {
  if (isServer) {
    callback();
  }
};

/**
 * Gets browser information (only valid on client)
 */
export const getBrowserInfo = () => {
  if (!isClient) return { name: 'server', version: 'n/a' };
  
  const userAgent = window.navigator.userAgent;
  
  if (userAgent.indexOf('Chrome') > -1) return { name: 'chrome', version: 'latest' };
  if (userAgent.indexOf('Safari') > -1) return { name: 'safari', version: 'latest' };
  if (userAgent.indexOf('Firefox') > -1) return { name: 'firefox', version: 'latest' };
  if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) return { name: 'ie', version: 'latest' };
  
  return { name: 'unknown', version: 'latest' };
};

// Export environment information
export default {
  isClient,
  isServer,
  isDevelopment,
  isProduction,
  isTest,
  runOnClient,
  runOnServer,
  getBrowserInfo,
};
