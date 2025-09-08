import { QueryResponse, UploadResponse, StreamingChunk } from "../lib/api";

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

    async streamQueryDocument(
      query: string, 
      onChunk: (chunk: StreamingChunk) => void,
      onError?: (error: Error) => void,
      onComplete?: () => void,
      documentId?: string
    ): Promise<void> {
      try {
        const response = await fetch(`${this.baseUrl}/documents/query?stream=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, documentId })
        });

        if (!response.ok) {
          throw new Error(`Query failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body available for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  onChunk(data);
                  
                  // Check if this is the final chunk
                  if (data.type === 'complete' || data.type === 'end' || data.type === 'error') {
                    if (onComplete) onComplete();
                    return;
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming chunk:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

      } catch (error) {
        console.error('Streaming query error:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }