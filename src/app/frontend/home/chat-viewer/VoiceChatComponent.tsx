'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, AudioLines, FileText} from 'lucide-react';
import { apiService } from '../../../../lib/api';
import { SimpleVisualizer } from '../../components/visualizer/SimpleVisualizer';
import PuffLoader from 'react-spinners/PuffLoader';
import { FaRegDotCircle } from 'react-icons/fa';
import { RiSquareFill } from 'react-icons/ri';

interface VoiceChatComponentProps {
  isSystemReady: boolean;
  selectedSessionId?: string;
  user?: any;
  currentDocument?: any;
  getAuthHeaders: () => Record<string, string>;
  checkDocumentExists: (documentId: string) => Promise<boolean>;
  handleDocumentDeleted: () => void;
  handleManualInput: () => void;
  onSessionCreated?: (sessionId: string) => void;
  toast?: any;
}

interface MessageBranch {
  content: string;
  timestamp: Date;
  subsequentMessages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'USER' | 'ASSISTANT';
  createdAt: Date;
  isTranscribed?: boolean;
  branches?: MessageBranch[];
  currentBranch?: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceChatComponent: React.FC<VoiceChatComponentProps> = ({
  isSystemReady,
  selectedSessionId,
  user,
  currentDocument,
  getAuthHeaders,
  checkDocumentExists,
  handleDocumentDeleted,
  onSessionCreated,
  toast,
  handleManualInput
}) => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(selectedSessionId || null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [visualizerReady, setVisualizerReady] = useState(false);
  const [documentExists, setDocumentExists] = useState(true);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SimpleVisualizer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  // Transcript feature states
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTranscriptWords, setCurrentTranscriptWords] = useState<string[]>([]);
  const [displayedWordCount, setDisplayedWordCount] = useState(0);
  const wordAnimationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to reconstruct chat history with branches properly displayed
  const reconstructChatHistoryWithBranches = (messages: ChatMessage[]): ChatMessage[] => {
    const result: ChatMessage[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      // If this is a USER message with branches, show the current branch content
      if (msg.type === "USER" && msg.branches && msg.branches.length > 0 && msg.currentBranch !== undefined) {
        const currentBranch = msg.branches[msg.currentBranch];
        if (currentBranch) {
          // Add the user message with branch content
          result.push({
            ...msg,
            content: currentBranch.content,
          });
          
          // Add the subsequent messages from this branch
          // These messages are stored in the branch and were deleted from the main chat_messages table
          if (currentBranch.subsequentMessages && currentBranch.subsequentMessages.length > 0) {
            result.push(...currentBranch.subsequentMessages);
            
            // Skip any messages in the database that are already in subsequentMessages
            // to prevent duplicates (this can happen if messages were added to the branch later)
            const subsequentMessageIds = new Set(
              currentBranch.subsequentMessages.map((m: ChatMessage) => m.id)
            );
            
            let skippedCount = 0;
            while (i + 1 < messages.length) {
              const nextMsg = messages[i + 1];
              if (subsequentMessageIds.has(nextMsg.id)) {
                i++; // Skip this message as it's already in the branch
                skippedCount++;
              } else {
                // This is a new message not in the branch, stop skipping
                break;
              }
            }
            
            if (skippedCount > 0) {
              console.log(`🔀 Skipped ${skippedCount} duplicate messages already in branch ${msg.currentBranch}`);
            }
          }
        } else {
          // Branch index is invalid, just show the message as-is
          result.push(msg);
        }
      } else {
        // Regular message without branches
        result.push(msg);
      }
    }
    
    return result;
  };

  // Load messages from database for a session
  const loadMessagesFromDatabase = async (sessionId: string) => {
    try {
      console.log('📚 Loading messages for session:', sessionId);
      const response = await fetch(`/backend/api/chat-messages?sessionId=${sessionId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const dbMessages = await response.json();
        console.log('✅ Loaded', dbMessages.length, 'messages from database');
        
        // Transform database messages to our ChatMessage format
        const formattedMessages: ChatMessage[] = dbMessages.map((msg: any) => ({
          id: msg.id || msg.messageId || Date.now().toString(),
          content: msg.content,
          type: msg.role as 'USER' | 'ASSISTANT',
          createdAt: new Date(msg.createdAt || msg.created_at),
          isTranscribed: msg.role === 'USER', // Mark user messages as potentially transcribed
          // Load branches from database if they exist
          ...(msg.branches && {
            branches: msg.branches,
            currentBranch: msg.current_branch ?? 0,
          }),
        }));
        
        // Reconstruct chat history with branches properly displayed
        const reconstructedMessages = reconstructChatHistoryWithBranches(formattedMessages);
        setMessages(reconstructedMessages);
        console.log(`📚 Showing ${reconstructedMessages.length} messages after branch reconstruction`);
      } else {
        console.warn('⚠️ Failed to load messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  };

  // Sync selectedSessionId prop with internal state and load messages
  useEffect(() => {
    if (selectedSessionId && selectedSessionId !== currentSessionId) {
      setCurrentSessionId(selectedSessionId);
      // Load existing messages from database
      loadMessagesFromDatabase(selectedSessionId);
    } else if (!selectedSessionId && currentSessionId) {
      // If session was cleared, clear messages too
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [selectedSessionId, currentSessionId]);

  // Load chat history when component mounts or document changes
  useEffect(() => {
    const loadInitialChatHistory = async () => {
      if (!currentDocument?.id || !user) return;

      try {
        console.log('🔍 Checking for existing chat sessions for document:', currentDocument.id);
        const response = await fetch('/backend/api/chat', {
          method: 'GET',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          const sessions = data.sessions || [];

          // Find sessions for current document
          const documentSessions = sessions.filter(
            (session: any) => session.documentId === currentDocument.id
          );

          if (documentSessions.length > 0 && !selectedSessionId) {
            // Load the most recent session
            const mostRecentSession = documentSessions[0];
            console.log('📖 Found existing session:', mostRecentSession.id);
            setCurrentSessionId(mostRecentSession.id);
            await loadMessagesFromDatabase(mostRecentSession.id);
            
            // Notify parent if callback exists
            if (onSessionCreated) {
              onSessionCreated(mostRecentSession.id);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading initial chat history:', error);
      }
    };

    loadInitialChatHistory();
  }, [currentDocument?.id]);

  // Setup microphone stream for visualizer
  const setupMicrophoneStream = async (): Promise<MediaStream | null> => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;
      
      if (visualizerRef.current) {
        visualizerRef.current.connectMediaStream(stream);
        console.log('🎤 Microphone connected to visualizer');
      }
      
      return stream;
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      setError('Failed to access microphone');
      return null;
    }
  };

  const stopMicrophoneStream = (): void => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎤 Microphone track stopped');
      });
      mediaStreamRef.current = null;
    }

    // Disconnect audio from visualizer to show idle animation
    if (visualizerRef.current) {
      visualizerRef.current.disconnectAudio();
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setSupportsSpeech(true);
      synthRef.current = speechSynthesis;
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        setError(null);
      };
      
      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscriptLocal = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptLocal += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        setTranscript(interimTranscript);
        if (finalTranscriptLocal) {
          console.log('📝 Final transcript:', finalTranscriptLocal);
          setFinalTranscript(finalTranscriptLocal);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('⚠️ Speech recognition not supported');
      setError('Speech recognition is not supported in this browser');
    }

    if (visualizerContainerRef.current) {
      try {
        visualizerRef.current = new SimpleVisualizer(visualizerContainerRef.current, {
          width: visualizerContainerRef.current.clientWidth,
          height: 400,
          colors: { red: 1.0, green: 0.8, blue: 0.2 }
        });
        
        visualizerRef.current.start();
        setVisualizerReady(true);
        console.log('🎨 Simple visualizer initialized');
      } catch (error) {
        console.error('Failed to initialize visualizer:', error);
        setVisualizerReady(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (visualizerRef.current) {
        visualizerRef.current.destroy();
        visualizerRef.current = null;
      }
      stopMicrophoneStream();
    };
  }, []);

  // Cleanup word animation interval on unmount
  useEffect(() => {
    return () => {
      if (wordAnimationIntervalRef.current) {
        clearInterval(wordAnimationIntervalRef.current);
      }
    };
  }, []);

  // Animate words when streaming content changes
  useEffect(() => {
    if (!showTranscript) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.type !== 'ASSISTANT' || !lastMessage.content) {
      setCurrentTranscriptWords([]);
      setDisplayedWordCount(0);
      return;
    }

    const words = lastMessage.content.split(' ').filter(w => w.trim());

    // Only reset if content has changed
    if (words.join(' ') !== currentTranscriptWords.join(' ')) {
      setCurrentTranscriptWords(words);
      setDisplayedWordCount(0);

      // Clear previous interval
      if (wordAnimationIntervalRef.current) {
        clearInterval(wordAnimationIntervalRef.current);
      }

      // Only animate during speaking
      if (isSpeaking) {
        let currentIndex = 0;
        wordAnimationIntervalRef.current = setInterval(() => {
          if (currentIndex < words.length) {
            setDisplayedWordCount(currentIndex + 1);
            currentIndex++;
          } else {
            if (wordAnimationIntervalRef.current) {
              clearInterval(wordAnimationIntervalRef.current);
              wordAnimationIntervalRef.current = null;
            }
          }
        }, 120); // 120ms per word for smooth animation
      } else {
        // If not speaking, show all words immediately
        setDisplayedWordCount(words.length);
      }
    }

  }, [messages, isSpeaking, showTranscript]);

  useEffect(() => {
    if (finalTranscript.trim() && !isProcessing) {
      console.log('✅ Auto-submitting transcript:', finalTranscript);
      handleSubmitTranscript(finalTranscript.trim());
      setFinalTranscript('');
      setTranscript('');
    }
  }, [finalTranscript]);

  useEffect(() => {
    if (isProcessing && isListening) {
      stopListening();
    }
  }, [isProcessing]);

  useEffect(() => {
    if (!isListening) {
      stopMicrophoneStream();
    }
  }, [isListening]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || !supportsSpeech) {
      console.error('Cannot start listening - recognition not available');
      setError('Speech recognition not available');
      return;
    }
    
    try {
      if (synthRef.current && isSpeaking) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      
      await setupMicrophoneStream();
      
      setTranscript('');
      setFinalTranscript('');
      
      console.log('🎤 Starting speech recognition...');
      recognitionRef.current.start();
      
      if (visualizerRef.current) {
        visualizerRef.current.setColors(0.2, 0.4, 1.0);
      }
      
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('Failed to start voice recognition');
    }
  }, [supportsSpeech, isSpeaking]);

  const interruptResponse = useCallback(() => {
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }

    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    setIsProcessing(false);
    setIsStreaming(false);

    if (visualizerRef.current) {
      visualizerRef.current.setColors(1.0, 0.8, 0.2);
    }

    console.log('🛑 Response interrupted by user');
    
    if (!isListening) {
      startListening();
    }
  }, [isSpeaking, isListening, startListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      stopMicrophoneStream();
      
      if (visualizerRef.current) {
        visualizerRef.current.setColors(1.0, 0.8, 0.2);
      }
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }, []);

  const createNewSession = async (): Promise<string | null> => {
    if (!currentDocument?.id) {
      setError('No document selected');
      return null;
    }

    try {
      const response = await fetch('/backend/api/chat-sessions', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: currentDocument.id,
          userId: user?.id
        })
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentSessionId(session.id);
        console.log('✅ New session created:', session.id);
        
        // Notify parent component about session creation
        if (onSessionCreated) {
          onSessionCreated(session.id);
        }
        
        return session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    
    return null;
  };

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<void> => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    if (currentSessionId && currentSessionId.trim() !== '') {
      try {
        const response = await fetch('/backend/api/chat-messages', {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: currentSessionId,  // Backend will handle conversion
            role: newMessage.type,         // 'USER' or 'ASSISTANT'
            content: newMessage.content,
            createdAt: newMessage.createdAt.toISOString(),
            tokensUsed: 0
          })
        });
        

        if (response.ok) {
          const savedMessage = await response.json();
          console.log('✅ Message saved:', savedMessage.id || savedMessage.messageId);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ Failed to save message:', response.status, errorData);
        }
      } catch (error) {
        console.error('❌ Error saving message:', error);
      }
    } else {
      console.warn('⚠️ No valid session ID, message not saved to database');
    }
  };

  const handleSubmitTranscript = async (text: string): Promise<void> => {
    if (!text.trim()) {
      console.log('❌ Cannot submit - text empty');
      return;
    }

    console.log('📤 Submitting transcript:', text);
    console.log('📊 System status:', { isSystemReady, currentDocument, currentSessionId });

    if (!currentDocument) {
      setError('No document selected. Please select a document first.');
      return;
    }

    const documentId = currentDocument.databaseId || currentDocument.id;
    if (!documentId) {
      setError('Invalid document. Please select another document.');
      return;
    }

    console.log('📄 Using document ID:', documentId);

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        setError('Failed to create chat session');
        return;
      }
    }

    await addMessage({
      content: text,
      type: 'USER',
      isTranscribed: true
    });

    setIsProcessing(true);

    try {
      let streamedContent = '';
      let assistantMessageId = '';
      let assistantMessageSaved = false; // ADD THIS FLAG
      
      // Add empty assistant message for UI
      const tempAssistantMessage: ChatMessage = {
        id: Date.now().toString(),
        content: '',
        type: 'ASSISTANT',
        createdAt: new Date()
      };
      assistantMessageId = tempAssistantMessage.id;
      setMessages(prev => [...prev, tempAssistantMessage]);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const sessionIdForRag = typeof window !== 'undefined' ? 
        (localStorage.getItem('rag_session_id') || sessionId) : sessionId;

      const ragApiUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000'
        : (process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000');

      console.log('🔄 Activating document in RAG system:', documentId);
      try {
        const activateResponse = await fetch(`${ragApiUrl}/activate-document/${documentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'X-Session-Id': sessionIdForRag || 'default'
          }
        });

        if (activateResponse.ok) {
          const activateResult = await activateResponse.json();
          console.log('✅ Document activated:', activateResult);
        } else {
          console.warn('⚠️ Document activation returned:', activateResponse.status);
        }
      } catch (activateError) {
        console.warn('⚠️ Could not activate document, will try query anyway:', activateError);
      }

      console.log('🔍 Querying RAG system...');
      
      const abortController = new AbortController();
      streamAbortControllerRef.current = abortController;
      setIsStreaming(true);

      const response = await fetch(`${ragApiUrl}/query?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'X-Session-Id': sessionIdForRag || 'default'
        },
        body: JSON.stringify({ query: text }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Query failed:', response.status, errorText);
        throw new Error(`Stream query failed: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'content_chunk' || data.type === 'chunk') {
                  streamedContent = data.partial_response || streamedContent + (data.chunk || data.content || '');
                  
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.type === 'ASSISTANT') {
                      lastMessage.content = streamedContent;
                    }
                    return newMessages;
                  });
                } else if (data.type === 'complete' || data.type === 'end') {
                  streamedContent = data.final_response || data.response || streamedContent;
                  
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.type === 'ASSISTANT') {
                      lastMessage.content = streamedContent;
                    }
                    return newMessages;
                  });
                  
                  // ONLY save once - check flag first
                  if (currentSessionId && streamedContent && streamedContent.trim() && !assistantMessageSaved) {
                    assistantMessageSaved = true; // SET FLAG
                    console.log('💾 Saving complete assistant message...');
                    fetch('/backend/api/chat-messages', {
                      method: 'POST',
                      headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        sessionId: currentSessionId,
                        role: 'ASSISTANT',
                        content: streamedContent,
                        createdAt: new Date().toISOString(),
                        tokensUsed: 0
                      })
                    }).then(response => {
                      if (response.ok) {
                        console.log('✅ Assistant message saved to database');
                      } else {
                        response.json().then(err => {
                          console.error('❌ Failed to save assistant message:', err);
                        });
                      }
                    }).catch(err => {
                      console.error('❌ Failed to save assistant message:', err);
                    });
                  }
                  
                  if (voiceEnabled && streamedContent) {
                    speakText(streamedContent);
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse chunk:', parseError);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🛑 Stream aborted by user');
          return;
        }
        throw error;
      } finally {
        setIsProcessing(false);
        setIsStreaming(false);
        streamAbortControllerRef.current = null;
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Request aborted by user');
        return;
      }
      
      console.error('❌ Chat API error:', error);
      await addMessage({
        content: 'Sorry, I encountered an error processing your request.',
        type: 'ASSISTANT'
      });
      setError('Failed to get response from assistant');
    } finally {
      setIsProcessing(false);
      setIsStreaming(false);
      streamAbortControllerRef.current = null;
    }
  };

  const speakText = useCallback((text: string) => {
    if (!synthRef.current || !voiceEnabled) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('🔊 Started speaking');
      
      if (visualizerRef.current) {
        visualizerRef.current.setColors(1.0, 0.8, 0.2);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('🔇 Finished speaking');
      
      if (visualizerRef.current) {
        visualizerRef.current.setColors(1.0, 0.8, 0.2);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  return (
    <div className="flex flex-col h-full bg-primary p-4">
      {/* Header with Manual Chat Button */}
      <div className=" flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AudioLines className="w-6 h-6" />
            Voice Mode
          </h2>
        </div>
      </div>

      <section className="flex flex-col-reverse">
        {/* Controls */}
        <div className="my-4">
            <div className="flex items-center justify-center gap-4">
              {/* Combined Mic/Stop Button */}
              <button
                onClick={(isProcessing || isSpeaking || isStreaming) ? interruptResponse : (isListening ? stopListening : startListening)}
                disabled={!supportsSpeech || !currentDocument}
                className={`p-5 rounded-full transition-all cursor-pointer ${
                  (isSpeaking)
                    ? 'bg-yellow hover:bg-yellow-600/80 animate-pulse'
                    : isProcessing
                    ? 'bg-green-500 hover:bg-green-600/80 animate-pulse'
                    : isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  (isProcessing || isSpeaking || isStreaming)
                    ? 'Stop and interrupt'
                    : !currentDocument 
                    ? 'Please select a document first' 
                    : isListening
                    ? 'Stop listening'
                    : 'Start voice input'
                }
              >
                {isSpeaking ? (
                  <RiSquareFill className="w-8 h-8 text-white" />
                ) : isProcessing ? (
                  <FaRegDotCircle className="w-8 h-8 text-white" />
                ) : isListening ? (
                  <Mic className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
                
              </button>
              
              <button
                onClick={() => {
                  console.log('🔄 Switching to manual chat mode');
                  handleManualInput();
                }}
                className="flex items-center gap-2 p-3 bg-blue/20 hover:bg-blue/30 text-blue-600 rounded-full transition-all cursor-pointer"
                title="Switch to manual typing mode"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>

            {/* System Status */}
            {!currentDocument && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                ⚠️ Please select or upload a document to start voice chat
              </div>
            )}
          </div>

          {/* Audio Visualizer */}
          <div className="mt-4 border rounded-lg overflow-hidden bg-primary relative">
            <div 
              ref={visualizerContainerRef}
              className="w-full h-full relative"
              style={{ minHeight: '400px' }}
            >
              {!visualizerReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                  <div className="text-center">
                    <PuffLoader color="#3B82F6" size={60} />
                    <p className="text-sm mt-2">Loading visualizer...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Indicator */}
            {visualizerReady && (
              <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                {isListening && '🔵 Listening'}
                {isSpeaking && '🟡 Speaking'}
                {isProcessing && '🧠 Processing'}
                {!isListening && !isSpeaking && !isProcessing && '⚪ Ready'}
              </div>
            )}

            {/* Transcript Toggle Button */}
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showTranscript
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-black/50 text-white hover:bg-black/70'
                }`}
                title={showTranscript ? 'Hide transcript' : 'Show transcript'}
              >
                <FileText className="w-3.5 h-3.5" />
                {showTranscript ? 'Hide' : 'Show'} Transcript
              </button>
            </div>

            {/* Transcript Display */}
            {showTranscript && currentTranscriptWords.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 backdrop-blur-sm rounded-lg p-4 max-h-30 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/20">
                  <span className="text-foreground text-xs font-medium uppercase tracking-wide">Transcript</span>
                  {isSpeaking && (
                    <span className="text-yellow-400 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                      Speaking...
                    </span>
                  )}
                </div>
                <div className="text-foreground text-sm leading-relaxed">
                  {currentTranscriptWords.slice(0, displayedWordCount).map((word, index) => {
                    // Add line breaks approximately every 12-15 words to prevent clutter
                    const shouldBreak = index > 0 && index % 12 === 0;
                    return (
                      <React.Fragment key={index}>
                        {shouldBreak && <br />}
                        <span
                          className="inline animate-fadeIn"
                          style={{
                            animationDelay: isSpeaking ? `${index * 0.03}s` : '0s',
                            animationFillMode: 'both'
                          }}
                        >
                          {word}
                        </span>
                        {' '}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
      </section>
    

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceChatComponent;