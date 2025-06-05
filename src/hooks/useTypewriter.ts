import { useState, useEffect, useRef } from 'react';

interface UseTypewriterProps {
  text: string;
  speed?: number;
  isStreaming: boolean;
  isAgent: boolean;
}

export function useTypewriter({
  text,
  speed = 50,
  isStreaming,
  isAgent,
}: UseTypewriterProps): string {
  const [displayedText, setDisplayedText] = useState('');
  const currentIndexRef = useRef(0);
  const prevIsStreamingRef = useRef(isStreaming);

  useEffect(() => {
    // Condition 1: If not an agent, or if not streaming, display full text immediately.
    if (!isAgent || !isStreaming) {
      setDisplayedText(text);
      currentIndexRef.current = text.length;
      prevIsStreamingRef.current = isStreaming; // Keep ref updated
      return; // Exit effect, no interval needed.
    }

    // Condition 2: Streaming for an agent message.
    // Check if streaming just started (was false, now true).
    if (isStreaming && !prevIsStreamingRef.current) {
      setDisplayedText(''); // Reset displayed text.
      currentIndexRef.current = 0; // Reset index.
    }
    // If isStreaming is true and was already true, and text changes,
    // currentIndexRef and displayedText should NOT reset, allowing typing to continue from current position.

    const intervalId = setInterval(() => {
      if (currentIndexRef.current < text.length) {
        // Important: Use the `text` from the hook's current scope (closure),
        // which will be updated if the `text` prop changes.
        setDisplayedText((prev) => prev + text[currentIndexRef.current]);
        currentIndexRef.current += 1;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    // Update prevIsStreamingRef for the next render.
    prevIsStreamingRef.current = isStreaming;

    return () => {
      clearInterval(intervalId);
      // prevIsStreamingRef.current is already updated at the end of the effect body,
      // so it reflects the state of `isStreaming` when this cleanup runs or before the next effect.
    };
  }, [text, speed, isStreaming, isAgent]); // Dependencies remain the same.

  // Effect to snap to full text if streaming stops abruptly or completes.
  useEffect(() => {
    if (!isStreaming && isAgent && currentIndexRef.current < text.length) {
      setDisplayedText(text);
      currentIndexRef.current = text.length;
    }
    // Also ensure prevIsStreamingRef is updated if this effect runs due to isStreaming change.
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, text, isAgent]); // Dependencies include isStreaming, text, isAgent.

  return displayedText;
}
