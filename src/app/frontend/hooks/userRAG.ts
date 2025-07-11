import { useState, useCallback } from 'react';
import { RAGApiClient } from '../utils/api-client';
import { QueryResponse } from '../types/api';

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
  
  return {
    query,
    loading,
    error,
    results,
    clearResults: () => setResults(null),
    clearError: () => setError(null)
  };
}