'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside a referenced element
 * 
 * @param callback - Function to call when click occurs outside
 * @returns Ref to attach to the element
 * 
 * Usage:
 * const ref = useClickOutside(() => setIsOpen(false));
 * <div ref={ref}>...</div>
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  enabled: boolean = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        callback();
      }
    }

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [callback, enabled]);

  return ref;
}

export default useClickOutside;
