// src/app/frontend/lib/api.ts
import axios, { AxiosError } from 'axios';
import { authUtils } from '@/lib/auth';

// API base URLs
const MAIN_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const RAG_API_BASE_URL = 'http://localhost:8000'; // Your existing RAG system

// Main API instance (for database operations)
export const mainApi = axios.create({
  baseURL: MAIN_API_BASE_URL,
  timeout: 90000,
});

// RAG API instance (for your existing RAG system)
const ragApi = axios.create({
  baseURL: RAG_API_BASE_URL,
  timeout: 30000,
});

// Add auth token to main API requests
mainApi.interceptors.request.use((config) => {
  const token = authUtils.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for API responses
export interface SystemStatus {
  status: string;
  pdf_loaded: boolean;
  index_ready: boolean;
  pdf_name?: string;
}

export interface QueryResponse {
  query: string;
  response: string;
  source_count: number;
}

export interface UploadResponse {
  documentId?: string;
  filename: string;
  originalName?: string;
  size?: number;
  uploadedAt?: string;
  pages_processed: number;
  message?: string;
  status?: string;
}

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: string;
  pageCount?: number;
  uploadedAt: string;
  chatSessionsCount: number;
  lastChatAt?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  documentId: string;
  documentName: string;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
  isSaved: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceNodes?: any;
  tokensUsed?: number;
  createdAt: string;
}

export interface ChatSessionDetail {
  sessionId: string;
  title: string;
  document: {
    id: string;
    name: string;
    size: number;
    pages?: number;
  };
  messages: ChatMessage[];
}

export interface AnalysisResponse {
  query: string;
  response: string;
  num_source_nodes: number;
  source_analysis: Array<{
    rank: number;
    score: number;
    page_number: string | number;
    chunk_type: string;
    content_length: number;
    content_preview: string;
    full_content?: string;
  }>;
}

export interface PresetQueries {
  preset_queries: Record<string, string>;
}

export interface RerankDemo {
  query: string;
  results: Array<{
    Stage: string;
    Rank: number;
    Score: number;
    Content: string;
    Page: string | number;
    Chunk_Type: string;
  }>;
}

// API functions
export const apiService = {
  // Document Management (Database)
  async uploadDocument(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await mainApi.post<UploadResponse>(
        '/backend/api/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      // Fallback to RAG API if database endpoint not available
      return this.uploadPdf(file);
    }
  },

  async getDocuments(): Promise<{ documents: Document[] }> {
    try {
      const response = await mainApi.get<{ documents: Document[] }>('/backend/api/documents');
      return response.data;
    } catch (error) {
      // Return empty array if database not available
      console.warn('Database documents endpoint not available, returning empty array');
      return { documents: [] };
    }
  },

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    try {
      const response = await mainApi.delete<{ message: string }>(`/backend/api/documents?id=${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete document');
    }
  },

  async bulkDeleteDocuments(documentIds: string[]): Promise<{ message: string }> {
    try {
      const response = await mainApi.delete<{ message: string }>(`/backend/api/documents/bulk-delete`, {
        data: { documentIds }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete documents');
    }
  },

  // Chat Management (Database)
  async createChatSession(documentId: string, title?: string): Promise<ChatSession> {
    try {
      const response = await mainApi.post<ChatSession>('/backend/api/chat', {
        documentId,
        title
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create chat session');
    }
  },

  async getChatSessions(): Promise<{ sessions: ChatSession[] }> {
    try {
      const response = await mainApi.get<{ sessions: ChatSession[] }>('/backend/api/chat');
      return response.data;
    } catch (error) {
      console.warn('Database chat sessions endpoint not available, returning empty array');
      return { sessions: [] };
    }
  },

  async getChatSession(sessionId: string): Promise<ChatSessionDetail> {
    try {
      const response = await mainApi.get<ChatSessionDetail>(`/backend/api/chat/${sessionId}/messages`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get chat session');
    }
  },

  async addMessage(sessionId: string, content: string, role: 'user' | 'assistant', sourceNodes?: any, tokensUsed?: number): Promise<ChatMessage> {
    try {
      const response = await mainApi.post<ChatMessage>(`/backend/api/chat/${sessionId}/messages`, {
        content,
        role,
        sourceNodes,
        tokensUsed
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to add message');
    }
  },

  // RAG System Endpoints (Existing)
  async getStatus(): Promise<SystemStatus> {
    try {
      const response = await ragApi.get<SystemStatus>('/status');
      return response.data;
    } catch (error) {
      // Return default status if RAG system not available
      console.warn('RAG system not available, returning default status');
      return {
        status: 'offline',
        pdf_loaded: false,
        index_ready: false
      };
    }
  },

  async uploadPdf(file: File, googleApiKey?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = new URLSearchParams();
    if (googleApiKey) {
      params.append('google_api_key', googleApiKey);
    }

    const response = await ragApi.post<UploadResponse>(
      `/upload-pdf?${params.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async queryDocuments(query: string): Promise<QueryResponse> {
    const response = await ragApi.post<QueryResponse>('/query', { query });
    return response.data;
  },

  async analyzeQuery(query: string, showContent: boolean = true): Promise<AnalysisResponse> {
    try {
      const response = await ragApi.post<AnalysisResponse>('/analyze-query', {
        query,
        show_content: showContent,
      });
      return response.data;
    } catch (error) {
      throw new Error('Analysis not available');
    }
  },

  async getPresetQueries(): Promise<PresetQueries> {
    try {
      const response = await ragApi.get<PresetQueries>('/preset-queries');
      return response.data;
    } catch (error) {
      // Return default preset queries if RAG system not available
      return {
        preset_queries: {
          "What is this document about?": "What is this document about?",
          "Summarize the main points": "Summarize the main points",
          "What are the key details?": "What are the key details?",
        }
      };
    }
  },

  async rerankDemo(query: string): Promise<RerankDemo> {
    const response = await ragApi.post<RerankDemo>('/rerank-demo', { query });
    return response.data;
  },

  async resetSystem(): Promise<{ message: string }> {
    try {
      const response = await ragApi.delete<{ message: string }>('/reset');
      return response.data;
    } catch (error) {
      return { message: 'System reset (RAG system offline)' };
    }
  },

  async healthCheck(): Promise<{ status: string; system_ready: boolean; pdf_loaded: boolean }> {
    try {
      const response = await ragApi.get('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'offline',
        system_ready: false,
        pdf_loaded: false
      };
    }
  },

  // Hybrid functions that work with both systems
  async uploadAndProcess(file: File): Promise<UploadResponse> {
    // First upload to RAG system for processing
    const ragResponse = await this.uploadPdf(file);
    
    // If user is authenticated, also save to database
    try {
      if (authUtils.isAuthenticated()) {
        await this.uploadDocument(file);
      }
    } catch (error) {
      console.warn('Failed to save to database, but RAG processing succeeded');
    }
    
    return ragResponse;
  }
};

// Error handler for API calls
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Add this to your existing src/app/frontend/lib/api.ts file

// Profile API functions
export const profileService = {
  // Get user profile
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await mainApi.get<UserProfile>('/backend/api/profile');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch profile');
    }
  },

  // Update user profile
  async updateProfile(updates: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    try {
      const response = await mainApi.patch<UpdateProfileResponse>('/backend/api/profile', updates);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Invalid profile data');
      }
      throw new Error('Failed to update profile');
    }
  },

  // Delete user account
  async deleteAccount(): Promise<{ message: string }> {
    try {
      const response = await mainApi.delete<{ message: string }>('/backend/api/profile?confirm=true');
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete account');
    }
  },

  async getSecurityLogs(): Promise<{ logs: SecurityLog[] }> {
    try {
      const response = await mainApi.get<{ logs: SecurityLog[] }>('/backend/api/security-logs');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch security logs');
    }
  }
};

// Add these types to your existing types or create src/app/frontend/types/profile.ts
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  subscription_status: 'BASIC' | 'STANDARD' | 'PREMIUM';
  profile_picture?: string;
  job_title?: string;
  created_at: string;
  last_login_at?: string;
  
  stats: {
    document_count: number;
    chat_session_count: number;
    total_messages: number;
    storage_used: number;
  };
  
  recentActivity: {
    documents: Array<{
      id: string;
      name: string;
      uploaded_at: string;
      size: number;
      pages?: number;
    }>;
    chat_sessions: Array<{
      id: string;
      title?: string;
      document_name: string;
      message_count: number;
      last_activity: string;
      is_saved: boolean;
    }>;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  job_title?: string;
  profile_picture?: string;
  current_password?: string;
  new_password?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: Partial<UserProfile>;
}

export interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  }
}
