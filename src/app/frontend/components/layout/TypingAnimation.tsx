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

  // Clean the text: split by newlines, trim each line, filter out empty lines, rejoin
  const cleanedText = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  let charCounter = 0;

  return (
    <span className="inline-block text-justify" style={{ wordBreak: 'keep-all', whiteSpace: 'normal' }}>
      {cleanedText.split('\n').map((line, lineIndex) => (
        <span key={lineIndex} className="block">
          {lineIndex > 0 && <br />}
          {line.split(' ').map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block whitespace-nowrap">
              {word.split('').map((char, charIndex) => {
                const currentIndex = charCounter++;
                return (
                  <span
                    key={charIndex}
                    className="inline-block opacity-0"
                    style={{
                      animation: 'smoothFadeIn 0.4s ease-out forwards',
                      animationDelay: `${currentIndex * (delay / 1000)}s`,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
              {wordIndex < line.split(' ').length - 1 && <span className="inline-block opacity-0" style={{
                animation: 'smoothFadeIn 0.4s ease-out forwards',
                animationDelay: `${charCounter++ * (delay / 1000)}s`,
              }}>{'\u00A0'}</span>}
            </span>
          ))}
        </span>
      ))}
      <style>{`
        @keyframes smoothFadeIn {
          0% {
            opacity: 0;
            transform: translateY(-3px);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
      `}</style>
    </span>
  );
};

export default TypingAnimation;
