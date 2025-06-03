// src/lib/__tests__/utils.test.ts
import { cn, safeToReactNode } from '../utils'; // Adjust path as necessary
import React from 'react';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
    expect(cn('foo', ['bar', { baz: true }])).toBe('foo bar baz');
  });

  it('should handle conditional classes', () => {
    const hasCondition = true;
    const noCondition = false;
    expect(cn({ 'conditional-class': hasCondition, 'another': noCondition })).toBe('conditional-class');
  });

  it('should override earlier classes with later ones in case of conflicting Tailwind classes', () => {
    // Example from tailwind-merge documentation
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should return empty string for no arguments or falsy arguments', () => {
    expect(cn()).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });
});

describe('safeToReactNode', () => {
  it('should return strings and numbers directly', () => {
    expect(safeToReactNode('Hello')).toBe('Hello');
    expect(safeToReactNode(123)).toBe(123);
  });

  it('should return valid React elements directly', () => {
    const element = React.createElement('div', null, 'Test');
    expect(safeToReactNode(element)).toBe(element);
  });

  it('should return fallback for undefined or null', () => {
    expect(safeToReactNode(undefined)).toBeNull(); // Default fallback
    expect(safeToReactNode(null)).toBeNull();    // Default fallback
    expect(safeToReactNode(undefined, 'Fallback')).toBe('Fallback');
    expect(safeToReactNode(null, 'Fallback')).toBe('Fallback');
  });

  it('should return fallback for objects that are not React elements', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const obj = { a: 1 };
    expect(safeToReactNode(obj)).toBeNull(); // Default fallback
    expect(safeToReactNode(obj, 'ObjectFallback')).toBe('ObjectFallback');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Attempted to render an unsafe value as ReactNode:', obj);
    consoleWarnSpy.mockRestore();
  });

  it('should return fallback for functions', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const func = () => 'hello';
    expect(safeToReactNode(func)).toBeNull(); // Default fallback
    expect(safeToReactNode(func, 'FunctionFallback')).toBe('FunctionFallback');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Attempted to render an unsafe value as ReactNode:', func);
    consoleWarnSpy.mockRestore();
  });

  it('should handle booleans (React renders them as null)', () => {
    // safeToReactNode currently returns them if they are not explicitly handled
    // React itself will not render anything for a boolean child, which is usually fine.
    // If the desired behavior for booleans was to always return the fallback, the function would need adjustment.
    // Based on the current implementation of safeToReactNode:
    // expect(safeToReactNode(true)).toBe(true); // This will pass if not explicitly handled
    // expect(safeToReactNode(false)).toBe(false); // This will pass if not explicitly handled

    // However, the description states "Booleans are rendered as null by React, which is usually fine."
    // and "Null and undefined are also fine as children, React ignores them."
    // The function aims to prevent *unsafe* values like complex objects or functions.
    // Let's test if it passes booleans through, as React handles their rendering (or non-rendering).
     expect(safeToReactNode(true)).toBe(true); // It returns the boolean
     expect(safeToReactNode(false)).toBe(false); // It returns the boolean
     // If we wanted it to convert booleans to null, the function would need:
     // if (typeof value === 'boolean') return null;
  });

  it('should handle React fragments', () => {
    const fragment = React.createElement(React.Fragment, null, React.createElement("span", null, "Child"));
    expect(safeToReactNode(fragment)).toBe(fragment);
  });
});
