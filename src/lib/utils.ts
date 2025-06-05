import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react'; // Ensure React is imported

// --- New Retry Logic ---
/**
 * Configuration for retryWithBackoff.
 */
export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
  logRetries?: boolean;
}

/**
 * Retries an asynchronous operation with exponential backoff.
 * @param operation The asynchronous function to retry.
 * @param config Configuration options for retries.
 * @returns A promise that resolves with the result of the operation.
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 200, // Increased initial delay
    shouldRetry = () => true, // Default to retrying all errors if not specified
    logRetries = true, // Default to logging retries
  } = config;

  let attempt = 0;
  let delayMs = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries || !shouldRetry(error)) {
        if (logRetries) {
          console.error(`Operation failed after ${attempt} attempt(s) or due to non-retryable error:`, error);
        }
        throw error;
      }
      if (logRetries) {
        console.warn(`Attempt ${attempt} of ${maxRetries} failed for operation. Retrying in ${delayMs}ms... Error:`, error.message || error);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  // This line should theoretically be unreachable due to the throw in the catch block.
  throw new Error('Max retries reached, but this part of the code should not be reachable.');
}

/**
 * Checks if an IndexedDB error is potentially transient and thus retryable.
 * @param error The error object.
 * @returns True if the error is deemed retryable, false otherwise.
 */
export const isRetryableIDBError = (error: any): boolean => {
  if (!error || !error.name) return false;
  // QuotaExceededError is generally not retryable without user intervention or significant delay.
  // UnknownError might be too generic. Focus on specific transient errors.
  return error.name === 'AbortError' || // Transaction aborted, often due to timeout or other concurrent operations
         error.name === 'TransactionInactiveError'; // Transaction became inactive
  // Consider DOMException codes if error.name is 'DOMException' and error.code gives more details.
};
// --- End of New Retry Logic ---

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a value to a ReactNode.
 * If the value is a valid ReactNode (string, number, boolean, element, fragment, portal), it's returned.
 * Otherwise, it returns a fallback (e.g., null or an empty string) to prevent rendering errors.
 * Booleans are rendered as null by React, which is usually fine.
 * Null and undefined are also fine as children, React ignores them.
 * The main goal is to ensure complex objects or functions are not passed directly as children.
 */
export function safeToReactNode(value: unknown, fallback: React.ReactNode = null): React.ReactNode {
  if (value === undefined || value === null) {
    return fallback;
  }
  // Allow strings, numbers, and React elements/fragments/portals
  if (typeof value === 'string' || typeof value === 'number' || React.isValidElement(value)) {
    return value as React.ReactNode;
  }
  // Optionally, handle booleans explicitly if needed, though React handles them by not rendering.
  // if (typeof value === 'boolean') {
  //   return null;
  // }
  // If it's an object that's not a React element, or a function, it's potentially unsafe.
  // Depending on strictness, one might log an error or simply return the fallback.
  console.warn('Attempted to render an unsafe value as ReactNode:', value);
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

export const capitalizeFirstLetter = (string: string | undefined): string => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};
