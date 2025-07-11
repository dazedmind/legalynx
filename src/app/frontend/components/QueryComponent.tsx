'use client';

import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, BarChart3, Shuffle, AlertCircle, Clock } from 'lucide-react';
import { apiService, handleApiError, QueryResponse, AnalysisResponse, PresetQueries, RerankDemo } from '../lib/api';

interface QueryComponentProps {
  isSystemReady: boolean;
}

export default function QueryComponent({ isSystemReady }: QueryComponentProps) {
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [rerankData, setRerankData] = useState<RerankDemo | null>(null);
  const [presetQueries, setPresetQueries] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'query' | 'analysis' | 'rerank'>('query');
  const [error, setError] = useState<string>('');

  // Load preset queries on component mount
  useEffect(() => {
    if (isSystemReady) {
      loadPresetQueries();
    }
  }, [isSystemReady]);

  const loadPresetQueries = async () => {
    try {
      const data = await apiService.getPresetQueries();
      setPresetQueries(data.preset_queries);
    } catch (error) {
      console.error('Failed to load preset queries:', error);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsQuerying(true);
    setError('');
    setResponse(null);
    setAnalysis(null);
    setRerankData(null);

    try {
      const result = await apiService.queryDocuments(query);
      setResponse(result);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setIsQuerying(false);
    }
  };

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError('Please enter a query to analyze');
      return;
    }

    setIsQuerying(true);
    setError('');

    try {
      const result = await apiService.analyzeQuery(query, true);
      setAnalysis(result);
      setActiveTab('analysis');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setIsQuerying(false);
    }
  };

  const handleRerank = async () => {
    if (!query.trim()) {
      setError('Please enter a query for reranking demo');
      return;
    }

    setIsQuerying(true);
    setError('');

    try {
      const result = await apiService.rerankDemo(query);
      setRerankData(result);
      setActiveTab('rerank');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setIsQuerying(false);
    }
  };

  const selectPresetQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setError('');
    setResponse(null);
    setAnalysis(null);
    setRerankData(null);
  };

  if (!isSystemReady) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <AlertCircle className="mx-auto w-12 h-12 mb-4" />
          <p className="text-lg font-medium">System Not Ready</p>
          <p>Please upload a PDF document first to start querying.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Query Documents</h2>

      {/* Preset Queries */}
      {Object.keys(presetQueries).length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Start - Select a preset query:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(presetQueries).map(([key, value]) => (
              <button
                key={key}
                onClick={() => selectPresetQuery(value)}
                className="text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter your question:
        </label>
        <div className="flex space-x-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about the uploaded document..."
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleQuery}
          disabled={isQuerying || !query.trim()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isQuerying ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Query
        </button>

        <button
          onClick={handleAnalyze}
          disabled={isQuerying || !query.trim()}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analyze
        </button>

        <button
          onClick={handleRerank}
          disabled={isQuerying || !query.trim()}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Rerank Demo
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {/* Tabs */}
      {(response || analysis || rerankData) && (
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            {response && (
              <button
                onClick={() => setActiveTab('query')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'query'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Response
              </button>
            )}
            {analysis && (
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Analysis
              </button>
            )}
            {rerankData && (
              <button
                onClick={() => setActiveTab('rerank')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rerank'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shuffle className="w-4 h-4 inline mr-1" />
                Reranking
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Results Display */}
      {activeTab === 'query' && response && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-medium text-blue-900 mb-2">Query:</h3>
            <p className="text-blue-800">{response.query}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-medium text-gray-900 mb-2">Response:</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{response.response}</p>
            <div className="mt-2 text-sm text-gray-600">
              Sources used: {response.source_count}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && analysis && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="font-medium text-green-900 mb-2">Analysis Summary:</h3>
            <p className="text-green-800">
              Found {analysis.num_source_nodes} relevant sources for the query
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Source Analysis:</h4>
            {analysis.source_analysis.map((source, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">
                    Rank #{source.rank}
                  </span>
                  <div className="text-sm text-gray-600">
                    Score: {source.score.toFixed(3)} | Page: {source.page_number} | Type: {source.chunk_type}
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{source.content_preview}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rerank' && rerankData && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <h3 className="font-medium text-purple-900 mb-2">Reranking Demonstration:</h3>
            <p className="text-purple-800">
              Showing how reranking improves retrieval quality for: "{rerankData.query}"
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Original Retrieval:</h4>
              {rerankData.results
                .filter(r => r.Stage === 'Original Retrieval')
                .map((result, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-red-900">#{result.Rank}</span>
                      <span className="text-sm text-red-700">Score: {result.Score.toFixed(3)}</span>
                    </div>
                    <p className="text-red-800 text-sm">{result.Content}</p>
                    <div className="text-xs text-red-600 mt-1">
                      Page: {result.Page} | Type: {result.Chunk_Type}
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">After Reranking:</h4>
              {rerankData.results
                .filter(r => r.Stage === 'After Reranking')
                .map((result, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-green-900">#{result.Rank}</span>
                      <span className="text-sm text-green-700">Score: {result.Score.toFixed(3)}</span>
                    </div>
                    <p className="text-green-800 text-sm">{result.Content}</p>
                    <div className="text-xs text-green-600 mt-1">
                      Page: {result.Page} | Type: {result.Chunk_Type}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}