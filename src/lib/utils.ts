import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { ReactNode } from 'react';

export function safeToReactNode(value: unknown): ReactNode {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return value as ReactNode;
  }
  if (Array.isArray(value)) {
    return value.map(safeToReactNode) as ReactNode[];
  }
  if (typeof value === 'object' && value !== null && '$$typeof' in value && Symbol.for('react.element')) {
     // It's already a React element
    return value as ReactNode;
  }
  // console.warn('safeToReactNode encountered an unhandled type:', typeof value, value);
  return null;
}
