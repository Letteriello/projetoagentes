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

  useEffect(() => {
    // If not streaming or not an agent, display full text immediately
    if (!isStreaming || !isAgent) {
      setDisplayedText(text);
      currentIndexRef.current = text.length; // Ensure index is at the end
      return;
    }

    // Reset for new streaming text
    setDisplayedText('');
    currentIndexRef.current = 0;

    const intervalId = setInterval(() => {
      if (currentIndexRef.current < text.length) {
        setDisplayedText((prev) => prev + text[currentIndexRef.current]);
        currentIndexRef.current += 1;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, isStreaming, isAgent]);

  // When streaming stops, but text might not be fully typed out yet (e.g. stream ended abruptly)
  // This effect ensures the final text is displayed if isStreaming becomes false.
  useEffect(() => {
    if (!isStreaming && isAgent && currentIndexRef.current < text.length) {
      setDisplayedText(text);
      currentIndexRef.current = text.length;
    }
  }, [isStreaming, text, isAgent]);


  return displayedText;
}
