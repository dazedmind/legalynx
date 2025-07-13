// utils/sessionManager.ts

export interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    query?: string;
    sourceCount?: number;
    analysis?: any;
    rerankData?: any;
  }
  
  export interface ChatSession {
    id: string;
    title: string;
    documentId: string;
    documentName: string;
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    messages: ChatMessage[];
  }
  
  export class SessionManager {
    private isAuthenticated: boolean;
    private userId?: string;
  
    constructor(isAuthenticated: boolean, userId?: string) {
      this.isAuthenticated = isAuthenticated;
      this.userId = userId;
    }
  
    private getStorageKey(type: 'sessions' | 'chat_history'): string {
      const suffix = this.isAuthenticated && this.userId ? `_${this.userId}` : '';
      return type === 'sessions' ? `chat_sessions${suffix}` : `rag_chat_history${suffix}`;
    }
  
    // Get all sessions for the current user
    getSessions(): ChatSession[] {
      try {
        const sessionsKey = this.getStorageKey('sessions');
        const savedSessions = localStorage.getItem(sessionsKey);
        
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          return sessions.map((session: any) => ({
            ...session,
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          })).sort((a: ChatSession, b: ChatSession) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
        return [];
      } catch (error) {
        console.error('Failed to load sessions:', error);
        return [];
      }
    }
  
    // Save sessions to localStorage
    saveSessions(sessions: ChatSession[]): void {
      try {
        const sessionsKey = this.getStorageKey('sessions');
        localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      } catch (error) {
        console.error('Failed to save sessions:', error);
      }
    }
  
    // Create a new session
    createSession(documentId: string, documentName: string, initialMessages: ChatMessage[] = []): ChatSession {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      // Generate a title from the first user message or use default
      const firstUserMessage = initialMessages.find(m => m.type === 'user');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${documentName}`;
  
      const lastAssistantMessage = [...initialMessages].reverse().find(m => m.type === 'assistant');
  
      const newSession: ChatSession = {
        id: sessionId,
        title,
        documentId,
        documentName,
        lastMessage: lastAssistantMessage ? lastAssistantMessage.content.substring(0, 100) : '',
        createdAt: now,
        updatedAt: now,
        messageCount: initialMessages.length,
        messages: initialMessages
      };
  
      // Save the new session
      const sessions = this.getSessions();
      sessions.push(newSession);
      this.saveSessions(sessions);
  
      return newSession;
    }
  
    // Update an existing session
    updateSession(sessionId: string, messages: ChatMessage[]): void {
      const sessions = this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex !== -1) {
        const lastAssistantMessage = [...messages].reverse().find(m => m.type === 'assistant');
        
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          messages,
          messageCount: messages.length,
          updatedAt: new Date().toISOString(),
          lastMessage: lastAssistantMessage ? lastAssistantMessage.content.substring(0, 100) : ''
        };
        
        this.saveSessions(sessions);
        
        // Also save to the regular chat history for current session
        const chatHistoryKey = this.getStorageKey('chat_history');
        localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
      }
    }
  
    // Delete a session
    deleteSession(sessionId: string): void {
      const sessions = this.getSessions();
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      this.saveSessions(updatedSessions);
    }
  
    // Get session by ID
    getSession(sessionId: string): ChatSession | null {
      const sessions = this.getSessions();
      return sessions.find(s => s.id === sessionId) || null;
    }
  
    // Load current chat history (for active session)
    getCurrentChatHistory(): ChatMessage[] {
      try {
        const chatHistoryKey = this.getStorageKey('chat_history');
        const saved = localStorage.getItem(chatHistoryKey);
        
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
        return [];
      } catch (error) {
        console.error('Failed to load chat history:', error);
        return [];
      }
    }
  
    // Save current chat history
    saveCurrentChatHistory(messages: ChatMessage[]): void {
      try {
        const chatHistoryKey = this.getStorageKey('chat_history');
        localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  
    // Clear current chat history
    clearCurrentChatHistory(): void {
      const chatHistoryKey = this.getStorageKey('chat_history');
      localStorage.removeItem(chatHistoryKey);
    }
  
    // Find existing session for a document
    findSessionForDocument(documentId: string): ChatSession | null {
      const sessions = this.getSessions();
      return sessions.find(s => s.documentId === documentId) || null;
    }
  
    // Restore session to current chat
    restoreSession(sessionId: string): ChatMessage[] {
      const session = this.getSession(sessionId);
      if (session) {
        this.saveCurrentChatHistory(session.messages);
        return session.messages;
      }
      return [];
    }
  
    // Get statistics
    getStatistics() {
      const sessions = this.getSessions();
      const totalMessages = sessions.reduce((sum, session) => sum + session.messageCount, 0);
      const totalSessions = sessions.length;
      
      return {
        totalSessions,
        totalMessages,
        averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
        oldestSession: sessions.length > 0 ? sessions[sessions.length - 1].createdAt : null,
        newestSession: sessions.length > 0 ? sessions[0].createdAt : null
      };
    }
  }