import React from 'react';
import { GoCopy, GoThumbsup, GoThumbsdown, GoSync } from 'react-icons/go';
import TypingAnimation from './TypingAnimation';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: Date;
    query?: string;
    sourceCount?: number;
  };
  isLatest?: boolean;
  isTyping?: boolean;
  onCopy?: (content: string) => void;
  onThumbsUp?: (messageId: string) => void;
  onThumbsDown?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLatest = false,
  isTyping = false,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  onRegenerate
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy?.(message.content);
  };

  return (
    <div className={`flex ${message.type === 'USER' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl p-4 ${
        message.type === 'USER' 
          ? 'bg-blue-600 text-white' 
          : 'bg-white text-gray-800 border border-gray-200'
      }`}>
        <div className="whitespace-pre-wrap">
          {message.type === 'ASSISTANT' && isLatest && isTyping
            ? <TypingAnimation text={message.content} delay={20} />
            : message.content}
        </div>
        
        {message.type === 'ASSISTANT' && (
          <div className="flex gap-3 text-xs opacity-50 mt-2">
            <GoCopy 
              className="w-4 h-4 cursor-pointer hover:text-blue-600 transition-colors" 
              onClick={handleCopy}
              title="Copy message"
            />
            <GoThumbsup 
              className="w-4 h-4 cursor-pointer hover:text-green-600 transition-colors"
              onClick={() => onThumbsUp?.(message.id)}
              title="Good response"
            />
            <GoThumbsdown 
              className="w-4 h-4 cursor-pointer hover:text-red-600 transition-colors"
              onClick={() => onThumbsDown?.(message.id)}
              title="Poor response"
            />
            <GoSync 
              className="w-4 h-4 cursor-pointer hover:text-gray-900 transition-colors"
              onClick={() => onRegenerate?.(message.id)}
              title="Regenerate response"
            />
          </div>
        )}

        {message.sourceCount && (
          <div className="text-xs opacity-70 mt-1">
            Sources: {message.sourceCount}
          </div>
        )}
      </div>
    </div>
  );
};