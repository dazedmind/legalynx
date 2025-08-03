// ChatContainer.tsx - Updated with edit functionality for user messages
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, User, Bot, Edit, Check, X, Send, ArrowUp } from 'lucide-react';
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
  
  // State for editing messages
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

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

  const handleStartEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editedContent.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (editedContent === chatHistory.find(m => m.id === messageId)?.content) {
      // No changes made
      handleCancelEdit();
      return;
    }

    setIsRegenerating(messageId);
    
    try {
      // Call the onMessageAction with edit action
      await onMessageAction('edit', messageId, editedContent.trim());
      
      // Reset editing state
      setEditingMessageId(null);
      setEditedContent('');
      
      toast.success('Message updated and response regenerated');
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Failed to update message');
    } finally {
      setIsRegenerating(null);
    }
  };

  const formatTime = (date: Date | string): string => {
    
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
    const isEditing = editingMessageId === message.id;
    const isRegeneratingThis = isRegenerating === message.id;
    
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
                  : 'bg-primary text-foreground border border-tertiary rounded-bl-md '
                } ${isEditing ? 'bg-blue/10 text-gray-900  rounded-bl-md w-120' : ''}
              } ${isRegeneratingThis ? 'opacity-50' : ''}`}
            >
              {/* Message Text or Edit Input */}
              {isEditing ? (
                <div className="w-full">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full text-foreground rounded-lg px-3 py-2 resize-none"
                    rows={Math.max(2, editedContent.split('\n').length)}
                    placeholder="Edit your message..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(message.id)}
                      disabled={!editedContent.trim() || isRegeneratingThis}
                      className="flex items-center gap-1 px-3 py-1 text-sm  text-white rounded-full bg-blue-600/60 hover:bg-blue-700 disabled:bg-tertiary disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isRegeneratingThis ? 'Updating...' : 'Send'}
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words text-md leading-relaxed">
                  {message.content}
                </div>
              )}

            </div>

            {/* Message Footer */}
            {!isEditing && (
              <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}>
                
                {/* Timestamp - Now always shows */}
                <span>{formatTime(message.createdAt)}</span>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  
                  {/* Edit Button - Only for User Messages */}
                  {isUser && documentExists && (
                    <button
                      onClick={() => handleStartEdit(message)}
                      disabled={isQuerying || isRegenerating !== null}
                      className="p-1 hover:bg-accent rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit message"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}

                  {/* Copy Button - For all messages */}
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="p-1 hover:bg-accent rounded transition-colors cursor-pointer"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {/* Assistant-only action buttons */}
                  {isAssistant && (
                    <>
                      {/* Thumbs Up */}
                      <button
                        onClick={() => onMessageAction('thumbsUp', message.id)}
                        className="p-1 hover:bg-accent rounded transition-colors cursor-pointer"
                        title="Good response"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>

                      {/* Thumbs Down */}
                      <button
                        onClick={() => onMessageAction('thumbsDown', message.id)}
                        className="p-1 hover:bg-accent rounded transition-colors cursor-pointer"
                        title="Poor response"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>

                      {/* Regenerate */}
                      <button
                        onClick={() => onMessageAction('regenerate', message.id)}
                        disabled={isQuerying || isRegenerating !== null}
                        className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto bg-primary chat-container"
    >
      <div className="mx-auto px-6 py-8">
        
        {/* Welcome Message */}
        {chatHistory.length === 0 && !isQuerying && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Ready to Chat!
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
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
              <div className="bg-primary border border-tertiary rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Not Available Message */}
        {!documentExists && chatHistory.length > 0 && (
          <div className="mt-8 p-4 bg-destructive/10 border border-destructive rounded-lg text-center">
            <p className="text-destructive text-sm">
              💔 Document is no longer available. You can view the conversation history above, but cannot continue chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}