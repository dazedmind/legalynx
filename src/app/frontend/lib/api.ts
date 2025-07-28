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

// Add auth token to RAG API requests for security features
ragApi.interceptors.request.use((config) => {
  const token = authUtils.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for API responses
export interface SystemStatus {
  status: string;
  pdfLoaded: boolean;
  indexReady: boolean;
  pdfName?: string;
}

export interface QueryResponse {
  query: string;
  response: string;
  sourceCount: number;
  securityStatus?: string; // Added for security feedback
}

export interface UploadResponse {
  documentId?: string;
  fileName?: string;
  originalFileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  pageCount?: number;
  message?: string;
  status?: string;
  securityStatus?: string;
  mimeType: string;
  conversionPerformed: boolean;
}

export interface Document {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  pageCount: number;
  uploadedAt: string;
  chatSessionsCount: number;
  lastChatAt: number;
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
    documentId: string;
    fileName: string;
    fileSize: number;
    pageCount: number;
  };
  messages: ChatMessage[];
}

export interface AnalysisResponse {
  query: string;
  response: string;
  numSourceNodes: number;
  sourceAnalysis: Array<{
    rank: number;
    score: number;
    pageNumber: string | number;
    chunkType: string;
    contentLength: number;
    contentPreview: string;
    fullContent?: string;
  }>;
}

export interface PresetQueries {
  presetQueries: Record<string, string>;
}

export interface RerankDemo {
  query: string;
  results: Array<{
    stage: string;
    rank: number;
    score: number;
    content: string;
    page: string | number;
    chunkType: string;
  }>;
}

// Security-specific types
export interface SecurityError extends Error {
  statusCode: number;
  type: 'rate_limit' | 'malicious_content' | 'integrity_check' | 'injection';
}

export interface SecurityStatus {
  rateLimits: {
    uploadsRemaining: number;
    queriesRemaining: number;
  };
  status: string;
}

// Security API functions
export const getSecurityStatus = async (): Promise<SecurityStatus> => {
  try {
    const response = await ragApi.get<SecurityStatus>('/security-status');
    return response.data;
  } catch (error) {
    // Return default status if security endpoint not available
    return {
      rateLimits: {
        uploadsRemaining: 10,
        queriesRemaining: 100
      },
      status: 'unknown'
    };
  }
};

// Enhanced error handling for security
const handleSecurityError = (error: any): SecurityError => {
  const securityError = new Error(error.response?.data?.detail || error.message) as SecurityError;
  securityError.statusCode = error.response?.status || 500;
  
  // Classify error type for better UX
  if (error.response?.status === 429) {
    securityError.type = 'rate_limit';
  } else if (error.response?.data?.detail?.includes('malicious')) {
    securityError.type = 'malicious_content';
  } else if (error.response?.data?.detail?.includes('integrity')) {
    securityError.type = 'integrity_check';
  } else if (error.response?.data?.detail?.includes('injection')) {
    securityError.type = 'injection';
  }
  
  return securityError;
};

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

  // RAG System Endpoints (Enhanced with Security)
  async getStatus(): Promise<SystemStatus> {
    try {
      const response = await ragApi.get<SystemStatus>('/status');
      return response.data;
    } catch (error) {
      // Return default status if RAG system not available
      console.warn('RAG system not available, returning default status');
      return {
        status: 'offline',
        pdfLoaded: false,
        indexReady: false
      };
    }
  },

  async uploadPdf(file: File, googleApiKey?: string): Promise<UploadResponse> {
    try {
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
    } catch (error) {
      throw handleSecurityError(error);
    }
  },

  async queryDocuments(query: string): Promise<QueryResponse> {
    try {
      const response = await ragApi.post<QueryResponse>('/query', { query });
      return response.data;
    } catch (error) {
      throw handleSecurityError(error);
    }
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

  async resetSystem(): Promise<{ message: string }> {
    try {
      const response = await ragApi.delete<{ message: string }>('/reset');
      return response.data;
    } catch (error) {
      return { message: 'System reset (RAG system offline)' };
    }
  },

  async healthCheck(): Promise<{ status: string; systemReady: boolean; pdfLoaded: boolean }> {
    try {
      const response = await ragApi.get('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'offline',
        systemReady: false,
        pdfLoaded: false
      };
    }
  },

  // Enhanced upload function with security error handling
  async uploadAndProcess(file: File): Promise<UploadResponse> {
    try {
      // First upload to RAG system for processing (now with security)
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
    } catch (error) {
      // Re-throw security errors with proper typing
      if (error instanceof Error && 'statusCode' in error) {
        throw error as SecurityError;
      }
      throw new Error('Upload failed');
    }
  },

  // Security-specific methods
  async getSecurityStatus(): Promise<SecurityStatus> {
    return getSecurityStatus();
  }
};

// Enhanced error handler for API calls with security support
export const handleApiError = (error: any): string => {
  // Handle security-specific errors
  if (error instanceof Error && 'statusCode' in error) {
    const securityError = error as SecurityError;
    
    switch (securityError.type) {
      case 'rate_limit':
        return 'Rate limit exceeded. Please wait before making another request.';
      case 'malicious_content':
        return 'Upload blocked: The content appears suspicious or malicious.';
      case 'integrity_check':
        return 'Upload failed: Document integrity verification failed.';
      case 'injection':
        return 'Query blocked: Please rephrase your question using normal language.';
      default:
        return securityError.message;
    }
  }

  // Handle regular API errors
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

// Profile API functions (unchanged)
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

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  profile_picture?: string;
  job_title?: string;
  created_at: string;
  last_login_at?: string;
  subscription: {
    plan_type: 'BASIC' | 'STANDARD' | 'PREMIUM';
    is_active: boolean;
    tokens_used: number;
    token_limit: number;
    days_remaining: number;
    billing_date: string;
    auto_renew: boolean;
    price: number;
    currency: string;
    created_at: string;
  }

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

// Utility function to check if an error is a security error
export const isSecurityError = (error: any): error is SecurityError => {
  return error instanceof Error && 'statusCode' in error && 'type' in error;
};

// Utility function to get user-friendly security error message
export const getSecurityErrorMessage = (error: SecurityError): string => {
  switch (error.type) {
    case 'rate_limit':
      return 'You\'ve reached your rate limit. Please wait a moment before trying again.';
    case 'malicious_content':
      return 'The uploaded content appears to contain suspicious elements and was blocked for security.';
    case 'integrity_check':
      return 'Document verification failed. Please try uploading the file again.';
    case 'injection':
      return 'Your query contains potentially harmful content. Please rephrase using normal language.';
    default:
      return error.message || 'A security error occurred.';
  }
};

