import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { LoadingMessage } from './LoadingMessage';
import { EmptyState } from './EmptyState';

interface ChatMessage {
  id: string;
  type: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
  query?: string;
  sourceCount?: number;
}

interface ChatContainerProps {
  chatHistory: ChatMessage[];
  isQuerying: boolean;
  documentExists: boolean;
  onMessageAction?: (action: string, messageId: string, content?: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  chatHistory,
  isQuerying,
  documentExists,
  onMessageAction
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isQuerying]);

  const handleCopy = (content: string) => {
    onMessageAction?.('copy', '', content);
  };

  const handleThumbsUp = (messageId: string) => {
    onMessageAction?.('thumbsUp', messageId);
  };

  const handleThumbsDown = (messageId: string) => {
    onMessageAction?.('thumbsDown', messageId);
  };

  const handleRegenerate = (messageId: string) => {
    onMessageAction?.('regenerate', messageId);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-4">
        {chatHistory.length === 0 ? (
          <EmptyState documentExists={documentExists} />
        ) : (
          chatHistory.map((message, idx) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLatest={idx === chatHistory.length - 1}
              isTyping={false} // You can control this based on your typing logic
              onCopy={handleCopy}
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
              onRegenerate={handleRegenerate}
            />
          ))
        )}
        
        {isQuerying && <LoadingMessage />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};