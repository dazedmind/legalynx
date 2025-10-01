import { useState, useCallback } from 'react';
import { RAGApiClient } from '../utils/api-client';
import { QueryResponse, StreamingChunk } from '../../../lib/api';

export function useRAG() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QueryResponse | null>(null);
  
  const apiClient = new RAGApiClient();
  
  const query = useCallback(async (queryText: string, documentId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.queryDocument(queryText, documentId);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const streamQuery = useCallback(async (
    queryText: string, 
    onChunk: (chunk: StreamingChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    documentId?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.streamQueryDocument(queryText, onChunk, onError, onComplete, documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Streaming query failed');
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    query,
    streamQuery,
    loading,
    error,
    results,
    clearResults: () => setResults(null),
    clearError: () => setError(null)
  };
}