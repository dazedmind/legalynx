// ChatContainer.tsx - Updated with edit functionality for user messages
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, User, Bot, Edit, Check, X, Send, ArrowUp, Trash } from 'lucide-react';
import { toast } from 'sonner';
import TypingAnimation from '../../components/layout/TypingAnimation';
import { BranchSelector } from '../../components/ui/BranchSelector';
import { Loader } from '../../components/ui/Loader';
import { TbCopy, TbEdit, TbRotateClockwise, TbTrash } from 'react-icons/tb';
import { HiChatBubbleBottomCenterText } from 'react-icons/hi2';
import { CitationRenderer } from './CitationRenderer';

interface MessageBranch {
  content: string; // The edited version of the user message
  createdAt: Date;
  subsequentMessages: ChatMessage[]; // All assistant messages that followed this version
}

interface ChatMessage {
  id: string;
  type: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
  query?: string;
  sourceCount?: number;
  isThinking?: boolean; // For pulse animation
  isStreaming?: boolean; // For streaming cursor animation
  branches?: MessageBranch[]; // Array of alternative conversation paths (for USER messages)
  currentBranch?: number; // Current branch index being displayed (0 = original, 1+ = edited versions)
  belongsToBranch?: {
    userMessageId: string;
    branchIndex: number;
  }; // For ASSISTANT messages that belong to a specific branch
}

interface ChatContainerProps {
  chatHistory: ChatMessage[];
  isQuerying: boolean;
  documentExists: boolean;
  onMessageAction: (action: string, messageId: string, content?: string) => void;
  typingMessageId?: string | null;
  onTypingComplete?: () => void;
  streamingMessageId?: string | null;
  onBranchChange?: (messageId: string, branchIndex: number) => void;
}

export function ChatContainer({
  chatHistory,
  isQuerying,
  documentExists,
  onMessageAction,
  typingMessageId,
  onTypingComplete,
  streamingMessageId,
  onBranchChange
}: ChatContainerProps) {

  // Use ref for scroll container
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // State for editing messages
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Track previous chat history length to detect new messages
  const prevChatHistoryLengthRef = useRef<number>(0);

  // Scroll to bottom only when new messages are added, not on every chat history change
  useEffect(() => {
    const currentLength = chatHistory.length;
    const previousLength = prevChatHistoryLengthRef.current;

    // Only scroll if:
    // 1. A new message was added (length increased)
    // 2. Currently querying (thinking/typing state)
    if (currentLength > previousLength || isQuerying) {
      scrollToBottom();
    }

    // Update the ref for next comparison
    prevChatHistoryLengthRef.current = currentLength;
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

  const deleteMessage = async (messageId: string) => {
    try {
      await onMessageAction('delete', messageId);
      toast.success('Message deleted successfully');
      
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
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

    // Example: "11:28 AM"
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.type === 'USER';
    const isAssistant = message.type === 'ASSISTANT';
    const isEditing = editingMessageId === message.id;
    const isRegeneratingThis = isRegenerating === message.id;

    // Check if this assistant message's user prompt has branches (for regeneration)
    let userMessageWithBranches: ChatMessage | null = null;
    let hasRegenerationBranches = false;
    
    if (isAssistant) {
      // Find the previous USER message
      for (let i = index - 1; i >= 0; i--) {
        if (chatHistory[i].type === 'USER') {
          userMessageWithBranches = chatHistory[i];
          break;
        }
      }
      
      // Check if all branches have the same content (regeneration) vs different content (edit)
      if (userMessageWithBranches?.branches && userMessageWithBranches.branches.length > 0) {
        const allSameContent = userMessageWithBranches.branches.every(
          branch => branch.content === userMessageWithBranches!.content
        );
        hasRegenerationBranches = allSameContent;
      }
    }

    return (
      <div
        key={message.id}
        className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} ${
          isUser ? 'chat-message-user group' : 'chat-message-assistant'
        }`}
      >
        <div className={`flex ${isUser ? '' : 'flex-row'} items-start gap-3 max-w-[85%]`}>

          {/* Message Content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1`}>
            
            {/* Message Bubble */}
            <div
              className={`relative px-4 py-3 rounded-2xl max-w-full transition-all duration-200 ${
                isUser
                  ? 'bg-blue-600 text-white rounded-br-xl'
                  : 'bg-primary text-foreground border border-tertiary rounded-bl-md '
                } ${isEditing ? 'bg-blue/10 text-gray-900  rounded-bl-md md:w-240' : ''}
              } ${isRegeneratingThis ? 'opacity-50' : ''}`}
              style={{
                animation: 'scaleIn 0.2s ease-out'
              }}
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
                  {/* Render USER messages */}
                  {message.type === 'USER' && (
                    <div>{message.content}</div>
                  )}

                  {/* Render ASSISTANT messages with pulse animation for thinking */}
                  {message.type === 'ASSISTANT' && (
                    message.isThinking ? (
                      <div className="flex items-center gap-2">
                        <Loader size={16} className="text-blue-500" />
                        <span className="text-muted-foreground italic animate-pulse">
                          {message.content}
                        </span>
                      </div>
                    ) : (
                      <CitationRenderer content={message.content} />
                    )
                  )}
                </div>
              )}

            </div>

            {/* Message Footer */}
            {!isEditing && !message.isThinking && !message.isStreaming && (
              <div
                className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                  isUser ? 'flex-row-reverse opacity-0 group-hover:opacity-100 transition-opacity duration-200' : 'flex-row'
                }`}
              >

                {/* Timestamp - Now always shows */}
                {/* <span>{formatTime(message.createdAt)}</span> */}

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
                      <TbEdit className="w-4 h-4" />
                    </button>
                  )}

                  {/* Copy Button - For all messages */}
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    disabled={isQuerying}
                    className="p-1 hover:bg-accent rounded transition-colors cursor-pointer"
                    title="Copy message"
                  >
                    <TbCopy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteMessage(message.id)}
                    disabled={isQuerying}

                    className="p-1 hover:bg-accent rounded transition-colors cursor-pointer"
                    title="Delete message"
                  >
                    <TbTrash className="w-4 h-4" />
                  </button>

                  {/* Branch Navigation - For USER messages with edited prompts (different content) */}
                  {isUser && message.branches && message.branches.length > 0 && onBranchChange && !message.branches.every(branch => branch.content === message.content) && (
                    <BranchSelector
                      currentBranch={message.currentBranch || 0}
                      totalBranches={message.branches.length}
                      onBranchChange={(branchIndex) => onBranchChange(message.id, branchIndex)}
                      className="ml-2"
                    />
                  )}

                  {/* Assistant-only action buttons */}
                  {isAssistant && (
                    <>
                      {/* Regenerate */}
                      <button
                        onClick={() => onMessageAction('regenerate', message.id)}
                        disabled={isQuerying || isRegenerating !== null}
                        className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate response"
                      >
                        <TbRotateClockwise  className="w-4 h-4" />
                      </button>
                      
                      {/* Branch Navigation - For regenerated responses (same prompt, different response) */}
                      {hasRegenerationBranches && userMessageWithBranches && onBranchChange && (
                        <BranchSelector
                          currentBranch={userMessageWithBranches.currentBranch || 0}
                          totalBranches={userMessageWithBranches.branches!.length}
                          onBranchChange={(branchIndex) => onBranchChange(userMessageWithBranches.id, branchIndex)}
                          className="ml-2"
                        />
                      )}
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
      <div className="mx-auto px-6 py-8 pb-0">
        
        {/* Welcome Message */}
        {chatHistory.length === 0 && !isQuerying && (
          <div className="text-center py-12 mt-10">
            <div className="w-16 h-16 bg-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiChatBubbleBottomCenterText className="w-8 h-8 text-blue-600" />
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
          {chatHistory.map((msg, index) => renderMessage(msg, index))}
        </div>

        {/* Typing Indicator - only show when not streaming */}
        {isQuerying && !streamingMessageId && (
          <div className="flex justify-start mb-6">
            <div className="flex items-start gap-3 max-w-[85%]">
  
              {/* Typing Animation */}
              {/* <div className="bg-primary border border-tertiary rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <p className="animate-pulse">Thinking... </p>
    
              </div> */}
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