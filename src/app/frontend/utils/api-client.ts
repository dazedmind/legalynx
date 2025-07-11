import { QueryResponse, UploadResponse } from "../types/api";

export class RAGApiClient {
    private baseUrl = '/backend/api';
    
    async uploadDocument(file: File): Promise<UploadResponse> {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.baseUrl}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    }
    
    async processDocument(documentId: string, filename: string): Promise<void> {
      const response = await fetch(`${this.baseUrl}/documents/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, filename })
      });
      
      if (!response.ok) {
        throw new Error('Processing failed');
      }
    }
    
    async queryDocument(query: string, documentId?: string): Promise<QueryResponse> {
      const response = await fetch(`${this.baseUrl}/documents/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, documentId })
      });
      
      if (!response.ok) {
        throw new Error('Query failed');
      }
      
      return response.json();
    }
  }