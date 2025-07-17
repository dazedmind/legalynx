import React, { useState, useEffect } from 'react';

const TypingAnimation = ({ text, delay }: { text: string, delay: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [index, text, delay]);

  return <span>{displayedText}</span>;
};

export default TypingAnimation;