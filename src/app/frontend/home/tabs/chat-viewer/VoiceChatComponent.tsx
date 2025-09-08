'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Send, Brain, AudioLines } from 'lucide-react';
import { apiService } from '../../../lib/api';
import { AudioVisualizer } from '../../../components/visualizer/AudioVisualizer'; // Adjust path as needed
import PuffLoader from 'react-spinners/PuffLoader';

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

interface ChatMessage {
  id: string;
  content: string;
  type: 'USER' | 'ASSISTANT';
  createdAt: Date;
  isTranscribed?: boolean;
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
  const [manualInput, setManualInput] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [documentExists, setDocumentExists] = useState(true);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState<number>(0);
  // Visualizer state and refs
  const [visualizerReady, setVisualizerReady] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<AudioVisualizer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Sync selectedSessionId prop with internal state
  useEffect(() => {
    if (selectedSessionId && selectedSessionId !== currentSessionId) {
      setCurrentSessionId(selectedSessionId);
      setMessages([]);
    }
  }, [selectedSessionId, currentSessionId]);

  // Session Management Functions
  const createNewSession = async (documentId?: string) => {
    if (!user || !currentDocument || isCreatingSession || !documentExists) return null;
    
    if (!currentDocument.databaseId) {
      toast?.error('Document is not saved to your account');
      return null;
    }
    
    try {
      setIsCreatingSession(true);
      const useDocumentId = documentId || currentDocument.databaseId || currentDocument.id;
      
      const exists = await checkDocumentExists(useDocumentId);
      if (!exists) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return null;
      }
      
      const response = await fetch('/backend/api/chat-sessions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          documentId: useDocumentId,
          title: `Chat with ${currentDocument.originalFileName}`,
          isSaved: false
        })
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentSessionId(session.id);
        setMessages([]);
        console.log('New chat session created:', session.id);
        onSessionCreated?.(session.id);
        return session.id;
      } else if (response.status === 404) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return null;
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      setDocumentExists(false);
      handleDocumentDeleted();
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const saveSessionToDatabase = async () => {
    if (!currentSessionId || !user || messages.length === 0 || !documentExists) {
      console.log('Skipping save - missing requirements:', {
        currentSessionId: !!currentSessionId,
        user: !!user,
        messageCount: messages.length,
        documentExists
      });
      return;
    }

    if (typeof currentSessionId !== 'string' || currentSessionId.trim() === '') {
      console.error('Invalid session ID:', currentSessionId);
      return;
    }

    try {
      setIsSaving(true);
      
      const firstUserMessage = messages.find(m => m.type === 'USER');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${currentDocument?.originalFileName || 'Document'}`;

      console.log('Saving session:', {
        sessionId: currentSessionId,
        title,
        messageCount: messages.length
      });

      const response = await fetch(`/backend/api/chat-sessions/${currentSessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          updatedAt: new Date().toISOString(),
          isSaved: true
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Session no longer exists, document may have been deleted');
          setDocumentExists(false);
          handleDocumentDeleted();
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save session');
      }

      const result = await response.json();
      console.log('Session saved successfully:', result);
      
      setHasUnsavedChanges(false);
      setLastSaveTimestamp(Date.now());

    } catch (error) {
      console.error('Failed to save session to database:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        setDocumentExists(false);
        handleDocumentDeleted();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    if (!documentExists) {
      console.warn('Cannot add message - document does not exist');
      return;
    }

    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setHasUnsavedChanges(true);

    if (currentSessionId && typeof currentSessionId === 'string' && currentSessionId.trim() !== '') {
      try {
        console.log('Saving message to database:', newMessage.content.substring(0, 50));
        const response = await fetch('/backend/api/chat-messages', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: newMessage.id,
            sessionId: currentSessionId,
            role: newMessage.type.toUpperCase(),
            content: newMessage.content,
            createdAt: newMessage.createdAt.toISOString(),
            tokensUsed: 0
          })
        });

        if (response.ok) {
          const savedMessage = await response.json();
          console.log('Message saved successfully:', savedMessage.messageId || savedMessage.id);
        } else if (response.status === 404) {
          console.log('Session not found, document may have been deleted');
          setDocumentExists(false);
          handleDocumentDeleted();
        } else {
          const errorData = await response.json();
          console.error('Failed to save message:', errorData);
        }
      } catch (error) {
        console.error('Failed to save message to database:', error);
      }
    } else {
      console.warn('Cannot save message - invalid session ID:', currentSessionId);
    }
  };

  // Setup microphone stream for visualizer (only when actively listening)
  const setupMicrophoneStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;
      
      // Create a muted audio element to prevent echo/feedback
      // This is CRITICAL to prevent user hearing themselves
      if (audioElementRef.current) {
        audioElementRef.current.remove();
      }
      
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      audioElement.muted = true; // MUST be muted to prevent feedback
      audioElement.volume = 0;   // Double protection
      audioElement.autoplay = false; // Don't auto-play
      audioElement.style.display = 'none'; // Hide the element
      audioElementRef.current = audioElement;
      
      // Don't append to DOM to prevent any chance of audio output
      
      if (visualizerRef.current) {
        const connected = visualizerRef.current.connectMediaStream(stream);
        if (connected) {
          console.log('🎤 Microphone connected to visualizer (fully muted)');
        }
      }
      
      return stream;
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      setError('Failed to access microphone for visualization');
      return null;
    }
  };

  // Stop microphone stream
  const stopMicrophoneStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎤 Microphone track stopped');
      });
      mediaStreamRef.current = null;
    }
    
    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }
  };

  // Initialize speech recognition and synthesis WITH visualizer
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setSupportsSpeech(true);
      synthRef.current = speechSynthesis;
      
      // Initialize recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
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
          setFinalTranscript(prev => prev + finalTranscriptLocal);
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

    // Initialize visualizer
    if (visualizerContainerRef.current) {
      try {
        visualizerRef.current = new AudioVisualizer(visualizerContainerRef.current, {
          width: visualizerContainerRef.current.clientWidth,
          height: 400,
          colors: { red: 1.0, green: 0.8, blue: 0.2 }, // Yellow for assistant
          bloom: { threshold: 0.1, strength: 0.4, radius: 0.1 },
          wireframe: true,
          mouseInteraction: true,
          enableGUI: false // Disable GUI for cleaner integration
        });
        
        visualizerRef.current.start();
        setVisualizerReady(true);
        console.log('🎨 Audio visualizer initialized');
      } catch (error) {
        console.error('Failed to initialize visualizer:', error);
        setVisualizerReady(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (currentUtteranceRef.current && synthRef.current) {
        synthRef.current.cancel();
      }
      // Stop TTS simulation
      stopTTSVisualizationSimulation();
      if (visualizerRef.current) {
        visualizerRef.current.destroy();
        visualizerRef.current = null;
      }
      // Stop microphone stream on cleanup
      stopMicrophoneStream();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Removed messagesEndRef
  }, [messages]);

  // Auto-submit when final transcript is available
  useEffect(() => {
    if (finalTranscript.trim() && !isProcessing) {
      handleSubmitTranscript(finalTranscript.trim());
      setFinalTranscript('');
      setTranscript('');
    }
  }, [finalTranscript, isProcessing]);

  // Stop listening when processing starts
  useEffect(() => {
    if (isProcessing && isListening) {
      stopListening();
    }
  }, [isProcessing, isListening]);

  // Stop microphone when listening stops
  useEffect(() => {
    if (!isListening) {
      stopMicrophoneStream();
    }
  }, [isListening]);

  // Auto-save session periodically
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      const timeoutId = setTimeout(() => {
        saveSessionToDatabase();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, isSaving]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || !supportsSpeech) return;
    
    try {
      // Stop any ongoing speech synthesis
      if (synthRef.current && isSpeaking) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      
      // Setup microphone for visualizer ONLY when starting to listen
      if (visualizerRef.current) {
        await setupMicrophoneStream();
      }
      
      setTranscript('');
      setFinalTranscript('');
      recognitionRef.current.start();
      
      // Set visualizer to blue when user is speaking
      if (visualizerRef.current) {
        visualizerRef.current.setColors(0.2, 0.4, 1.0); // Blue for user
      }
      
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('Failed to start voice recognition');
    }
  }, [supportsSpeech, isSpeaking]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      
      // Stop microphone stream when stopping listening
      stopMicrophoneStream();
      
      // Reset visualizer to neutral colors
      if (visualizerRef.current) {
        visualizerRef.current.setColors(1.0, 0.8, 0.2); // Yellow for assistant
      }
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }, []);

  const handleSubmitTranscript = async (text: string) => {
    if (!text.trim() || !isSystemReady) return;

    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        setError('Failed to create chat session');
        return;
      }
    }

    // Add user message
    await addMessage({
      content: text,
      type: 'USER',
      isTranscribed: true
    });

    setIsProcessing(true);

    try {
      // Create assistant message for streaming
      const assistantMessageId = Date.now().toString();
      let streamedContent = '';
      
      // Add empty assistant message
      await addMessage({
        content: '',
        type: 'ASSISTANT'
      });

      // Use streaming API
      await apiService.streamQueryDocuments(text, (chunk) => {
        if (chunk.type === 'content_chunk') {
          streamedContent = chunk.partial_response || streamedContent + chunk.chunk;
        } else if (chunk.type === 'complete') {
          streamedContent = chunk.final_response || streamedContent;
          
          // Speak the response if voice is enabled
          if (voiceEnabled && streamedContent) {
            speakText(streamedContent);
          }
        }
      });

    } catch (error) {
      console.error('❌ Chat API error:', error);
      await addMessage({
        content: 'Sorry, I encountered an error processing your request.',
        type: 'ASSISTANT'
      });
      setError('Failed to get response from assistant');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = useCallback((text: string) => {
    if (!synthRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('🔊 Started speaking');
      
      // Set visualizer to yellow when assistant is speaking
      if (visualizerRef.current) {
        visualizerRef.current.setColors(1.0, 0.8, 0.2); // Yellow for assistant
        
        // Create a fake audio frequency simulation for TTS visualization
        // Since we can't access the actual TTS audio stream, we'll simulate it
        startTTSVisualizationSimulation();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      console.log('🔇 Finished speaking');
      
      // Stop TTS simulation and reset visualizer to neutral blue
      stopTTSVisualizationSimulation();
      if (visualizerRef.current) {
        visualizerRef.current.setColors(1.0, 0.8, 0.2); // Yellow for assistant
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      
      // Stop simulation and reset visualizer color on error
      stopTTSVisualizationSimulation();
      if (visualizerRef.current) {
        visualizerRef.current.setColors(1.0, 0.8, 0.2); // Yellow for assistant
      }
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  // TTS Visualization Simulation (since we can't access actual TTS audio stream)
  const ttsSimulationRef = useRef<number | null>(null);
  
  const startTTSVisualizationSimulation = () => {
    if (!visualizerRef.current) return;
    
    // Simulate audio frequency data for the visualizer during TTS
    const simulateFrequency = () => {
      if (visualizerRef.current && isSpeaking) {
        // Generate realistic frequency simulation for speech
        const baseFrequency = 40 + Math.random() * 60; // Speech frequency range
        const variation = Math.sin(Date.now() * 0.01) * 20;
        const simulatedFrequency = baseFrequency + variation;
        
        // Manually set the frequency for visualization
        if (visualizerRef.current.uniforms) {
          visualizerRef.current.uniforms.u_frequency.value = simulatedFrequency;
        }
        
        ttsSimulationRef.current = requestAnimationFrame(simulateFrequency);
      }
    };
    
    simulateFrequency();
  };
  
  const stopTTSVisualizationSimulation = () => {
    if (ttsSimulationRef.current) {
      cancelAnimationFrame(ttsSimulationRef.current);
      ttsSimulationRef.current = null;
    }
    
    // Reset frequency to 0 when not speaking
    if (visualizerRef.current && visualizerRef.current.uniforms) {
      visualizerRef.current.uniforms.u_frequency.value = 0;
    }
  };

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      
      // Stop TTS simulation and reset visualizer color
      stopTTSVisualizationSimulation();
      if (visualizerRef.current) {
        // visualizerRef.current.setColors(0.3, 0.6, 1.0);
      }
    }
  }, []);

  // Determine button icon and state
  const getMicrophoneButton = () => {
    if (isProcessing) {
      return (
        <button
          disabled={true}
          className="p-4 rounded-full bg-yellow-500 text-white shadow-lg scale-110 animate-pulse cursor-not-allowed opacity-75"
          title="Processing..."
        >
          <PuffLoader color="#ffffff" size={24} />
        </button>
      );
    }

    if (isListening) {
      return (
        <button
          onClick={stopListening}
          disabled={isCreatingSession || !documentExists}
          className="p-4 rounded-full bg-blue-500 text-white shadow-lg scale-110 animate-pulse cursor-pointer"
          title="Stop listening"
        >
          <MicOff className="w-6 h-6" />
        </button>
      );
    }

    return (
      <button
        onClick={startListening}
        disabled={isCreatingSession || !documentExists}
        className={`p-4 rounded-full transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:scale-105 ${
          (isCreatingSession || !documentExists) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title="Start listening"
      >
        <Mic className="w-6 h-6" />
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-primary">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-primary p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <AudioLines className="w-5 h-5" />
              Voice Mode
            </h2>
            {/* Save status indicator */}
            {isSaving && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                Saving...
              </div>
            )}
            {hasUnsavedChanges && !isSaving && (
              <div className="w-2 h-2 bg-orange-400 rounded-full" title="Unsaved changes" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualInput}
              className={`p-2 rounded-lg transition-colors hover:bg-accent text-foreground cursor-pointer`}
              title="Manual input"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                voiceEnabled ? 'bg-blue/20 text-blue-600' : 'hover:bg-accent'
              }`}
              title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Loading visualizer...</p>
                </div>
              </div>
            )}
          </div>
          {/* Visualizer Status Indicator */}
          {visualizerReady && (
            <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
              {isListening && '🔵 Listening'}
              {isSpeaking && '🟡 Speaking'}
              {isProcessing && '🧠 Processing'}
              {!isListening && !isSpeaking && !isProcessing && '⚪ Ready'}
            </div>
          )}
        </div>
        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        {/* Document status */}
        {!documentExists && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            Document no longer exists. Please select another document.
          </div>
        )}
      </div>
      {/* Voice Controls */}
      <div className="flex-shrink-0 border-t bg-primary p-4">
        <div className="flex items-center justify-center gap-4">
          {supportsSpeech && getMicrophoneButton()}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-3 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors shadow-md"
              title="Stop speaking"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
        </div>
        {/* Status indicators */}
        <div className="text-center mt-2 text-sm text-gray-600">
          {isSpeaking && (
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Speaking...
            </span>
          )}
          {isProcessing && (
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Pondering...
            </span>
          )}
          {!isListening && !isSpeaking && !isProcessing && !isCreatingSession && supportsSpeech && documentExists && (
            <span className="text-gray-400">Click microphone to start</span>
          )}
          {!supportsSpeech && (
            <span className="text-orange-500">Voice not supported - use manual input</span>
          )}
          {!documentExists && (
            <span className="text-red-500">Document not available</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChatComponent;