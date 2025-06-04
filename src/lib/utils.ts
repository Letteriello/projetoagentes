import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react'; // Ensure React is imported

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
