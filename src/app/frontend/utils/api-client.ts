import { QueryResponse, UploadResponse, StreamingChunk } from "../../../lib/api";

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
      documentId?: string,
      abortSignal?: AbortSignal,
      voiceMode?: boolean
    ): Promise<void> {
      const startTime = Date.now();
      console.log(`🚀 FRONTEND: Starting stream query at ${startTime}`);

      try {
        // Use the correct RAG API endpoint for streaming with proper auth
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('rag_session_id');

        console.log(`🔐 AUTH: Token: ${token ? 'present' : 'missing'}, Session: ${sessionId}`);

        // Use environment variable for RAG API URL, fallback to localhost for development
        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';
        const streamUrl = `${ragApiUrl}/query?stream=true`;
        console.log(`🌐 FRONTEND: Using RAG API URL: ${streamUrl}`);

        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Session-Id': sessionId || ''
          },
          body: JSON.stringify({ 
            query,
            voice_mode: voiceMode || false 
          }),
          signal: abortSignal
        });

        console.log(`🌊 FRONTEND: Response received at ${Date.now() - startTime}ms`);

        if (!response.ok) {
          throw new Error(`Query failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body available for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let firstChunkTime: number | null = null;
        let chunkCount = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log(`✅ FRONTEND: Stream completed after ${chunkCount} chunks in ${Date.now() - startTime}ms`);
              break;
            }

            if (firstChunkTime === null) {
              firstChunkTime = Date.now();
              console.log(`📦 FRONTEND: First chunk received at ${firstChunkTime - startTime}ms`);
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  chunkCount++;
                  const data = JSON.parse(line.slice(6));
                  // Process chunk immediately regardless of tab visibility
                  onChunk(data);

                  // Check if this is the final chunk
                  if (data.type === 'stream_end' || data.type === 'end' || data.type === 'error') {
                    console.log(`🏁 FRONTEND: Final chunk received at ${Date.now() - startTime}ms`);
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
        // Check if this is an abort error (user clicked stop button)
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🛑 FRONTEND: Streaming query aborted by user');
          if (onError) {
            onError(error);
          }
          return;
        }

        console.error('Streaming query error:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }