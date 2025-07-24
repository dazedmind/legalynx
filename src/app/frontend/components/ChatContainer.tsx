// ChatContainer.tsx - Fixed scroll and timestamp issues
'use client';

import React, { useEffect, useRef } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, User, Bot } from 'lucide-react';
import { toast } from 'sonner';
import TypingAnimation from './TypingAnimation';

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
  onMessageAction: (action: string, messageId: string, content?: string) => void;
}

export function ChatContainer({ 
  chatHistory, 
  isQuerying, 
  documentExists, 
  onMessageAction 
}: ChatContainerProps) {

  // Use ref for scroll container
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom whenever chat history changes or when querying state changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isQuerying]);
  
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onMessageAction('copy', messageId, text);
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast.error('Failed to copy message');
    }
  };

  const formatTime = (date: Date | string): string => {
    // Add debugging to see what we're getting
    console.log('formatTime called with:', { date, type: typeof date, isDate: date instanceof Date });
    
    let d: Date;

    if (typeof date === 'string') {
      // Try to parse ISO string or other date string
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      // Fallback for unexpected types
      console.warn('Unexpected date type provided to formatTime:', typeof date, date);
      return '';
    }

    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.warn('Invalid date provided to formatTime:', date);
      return '';
    }

    // Example: "11:28 AM"
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'USER';
    const isAssistant = message.type === 'ASSISTANT';
    
    // Debug logging to help identify the issue
    console.log('Rendering message:', {
      id: message.id,
      type: message.type,
      isUser,
      isAssistant,
      content: message.content.substring(0, 50)
    });

    return (
      <div
        key={message.id}
        className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`flex ${isUser ? '' : 'flex-row'} items-start gap-3 max-w-[85%]`}>
          
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.type === "ASSISTANT" ? 'bg-gray-700 text-white' : ''}`}>
            {message.type === "ASSISTANT" &&(
              <Bot className="w-4 h-4" />
            )}
          </div>

          {/* Message Content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1`}>
            
            {/* Message Bubble */}
            <div
              className={`relative px-4 py-3 rounded-2xl max-w-full ${
                isUser
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
              }`}
            >
              {/* Message Text */}
              <div className="whitespace-pre-wrap break-words text-md leading-relaxed">
                {message.content}
              </div>

            </div>

            {/* Message Footer */}
            <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}>
              
              {/* Timestamp - Now always shows */}
              <span>{formatTime(message.createdAt)}</span>
              
              {/* Action Buttons - Only for Assistant Messages */}
              {isAssistant && (
                <div className="flex items-center gap-1">
                  
                  {/* Copy Button */}
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {/* Thumbs Up */}
                  <button
                    onClick={() => onMessageAction('thumbsUp', message.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    title="Good response"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>

                  {/* Thumbs Down */}
                  <button
                    onClick={() => onMessageAction('thumbsDown', message.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    title="Poor response"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>

                  {/* Regenerate */}
                  <button
                    onClick={() => onMessageAction('regenerate', message.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto bg-gray-50 chat-container"
    >
      <div className="mx-auto px-6 py-8">
        
        {/* Welcome Message */}
        {chatHistory.length === 0 && !isQuerying && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Chat!
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask me anything about your uploaded document. I can help you find information, summarize content, or answer specific questions.
            </p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-1">
          {chatHistory.map(renderMessage)}
        </div>

        {/* Typing Indicator */}
        {isQuerying && (
          <div className="flex justify-start mb-6">
            <div className="flex items-start gap-3 max-w-[85%]">
              
              {/* Bot Avatar */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>

              {/* Typing Animation */}
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Not Available Message */}
        {!documentExists && chatHistory.length > 0 && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700 text-sm">
              💔 Document is no longer available. You can view the conversation history above, but cannot continue chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}