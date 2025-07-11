import axios from 'axios';

// API base URL - adjust this to match your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
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
  message: string;
  filename: string;
  pages_processed: number;
  status: string;
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
  // Get system status
  async getStatus(): Promise<SystemStatus> {
    const response = await api.get<SystemStatus>('/status');
    return response.data;
  },

  // Upload PDF file
  async uploadPdf(file: File, googleApiKey?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = new URLSearchParams();
    if (googleApiKey) {
      params.append('google_api_key', googleApiKey);
    }

    const response = await api.post<UploadResponse>(
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

  // Query documents
  async queryDocuments(query: string): Promise<QueryResponse> {
    const response = await api.post<QueryResponse>('/query', { query });
    return response.data;
  },

  // Analyze query
  async analyzeQuery(query: string, showContent: boolean = true): Promise<AnalysisResponse> {
    const response = await api.post<AnalysisResponse>('/analyze-query', {
      query,
      show_content: showContent,
    });
    return response.data;
  },

  // Get preset queries
  async getPresetQueries(): Promise<PresetQueries> {
    const response = await api.get<PresetQueries>('/preset-queries');
    return response.data;
  },

  // Rerank demonstration
  async rerankDemo(query: string): Promise<RerankDemo> {
    const response = await api.post<RerankDemo>('/rerank-demo', { query });
    return response.data;
  },

  // Reset system
  async resetSystem(): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/reset');
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; system_ready: boolean; pdf_loaded: boolean }> {
    const response = await api.get('/health');
    return response.data;
  },
};

// Error handler for API calls
export const handleApiError = (error: any): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};