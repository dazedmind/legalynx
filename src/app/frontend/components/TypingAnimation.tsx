import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  delay: number;
  onComplete?: () => void;
}

const TypingAnimation = ({ text, delay, onComplete }: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeoutId);
    } else if (index === text.length && onComplete) {
      // Call onComplete when typing is finished
      onComplete();
    }
  }, [index, text, delay, onComplete]);

  return <span>{displayedText}</span>;
};

export default TypingAnimation;